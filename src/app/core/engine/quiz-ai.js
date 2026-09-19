import { generateQuiz } from './quizgen.js'
import { checkTyped } from './textproc.js'
import { hasApiKey, chatJSON, chatMultimodal } from './gemini.js'
import { listDocImages, saveDocImages, updateDoc } from './storage.js'
import { renderPdfVisuals } from './extract/renderPage.js'
import { extractTitleLines, keyTerms, mulberry32, shuffleArr, cleanSentence, hashString } from './textproc.js'
import { sentences, termFreq, scoreSentences, stripHeadings } from './textproc.js'
import { detectTopics } from './topics.js'
import { MCQ_RULES, mcqPrompt, ID_RULES, shortGradePrompt, SHORT_GRADE_RULES, DOC_VISUAL_RULES, VISUAL_Q_RULES, visualQuestionPrompt, explainBatchPrompt, authorQuizPrompt, examAuthorPrompt } from './prompts.js'
import {
  extractJSONArray,
  clean,
  makeBannedCheckerFromTitles,
  validateGeneratedMcq,
  validateGeneratedClue,
  validateGeneratedShort,
  escapeRegExp
} from './validate.js'

function blobToDataUrlLocal(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Run async task factories with limited concurrency. AI authoring fires
// several batch prompts at once — this keeps the wall time at roughly
// ceil(batches / limit) × one call instead of summing every call, while
// staying under the relay's rate limits.
async function runPool(factories, limit) {
  const results = new Array(factories.length)
  let next = 0
  const workers = Array.from({ length: Math.max(1, Math.min(limit, factories.length)) }, async () => {
    while (next < factories.length) {
      const i = next++
      try { results[i] = await factories[i]().then(r => ({ ok: true, r })) }
      catch (e) { results[i] = { ok: false, err: e } }
    }
  })
  await Promise.all(workers)
  return results.map(r => (r && r.ok) ? r.r : new Error(r?.err?.message || 'batch_failed'))
}

// Shrink large stored slide images before uploading to Gemini so the multimodal
// round stays fast and cheap (stored images can be multi-MB PNGs).
async function blobToDataUrlShrunk(blob, maxDim = 1280, quality = 0.8) {
  try {
    const bmp = await createImageBitmap(blob)
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    const out = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (out) return await blobToDataUrlLocal(out)
  } catch { /* fall back to original */ }
  return blobToDataUrlLocal(blob)
}

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '')
  if (!m) return null
  return { mimeType: m[1], data: m[2] }
}

// Two-model document analysis.
//
// 1. GEMINI "sees" the document once (cached on the doc): it renders the
//    relevant PDF pages (or reuses already-extracted pptx/docx/photo images) and
//    returns a structured description of each visual element (code/diagram/...).
// 2. GLM authors the actual questions every run from that cached analysis.
//
// Returns { elements, cached } or null when there is nothing visual to analyze.
export async function ensureVisualAnalysis(doc) {
  if (Array.isArray(doc.visualAnalysis) && doc.visualAnalysis.length) {
    return { elements: doc.visualAnalysis, cached: true }
  }

  // Gather candidate images: render PDF pages, or reuse extracted media.
  let raw = [] // { id, page, blob, mime }
  if (doc.type === 'pdf' && doc.original instanceof Blob) {
    try {
      const rendered = await renderPdfVisuals(doc.original, { maxPages: 8 })
      raw = rendered.map(r => ({ id: null, page: r.page, blob: r.blob, mime: r.mime }))
    } catch (e) {
      console.warn('pdf visual render failed', e)
    }
  } else {
    try {
      const stored = await listDocImages(doc.id)
      raw = stored
        .filter(im => im.blob && im.blob.size >= 4096)
        .map(im => ({ id: im.id, page: im.slideNumber || 0, blob: im.blob, mime: im.mime }))
    } catch { /* best-effort */ }
  }
  if (!raw.length) return null

  const parts = []
  const kept = []
  for (const it of raw) {
    const parsed = parseDataUrl(await blobToDataUrlShrunk(it.blob, 1280, 0.8).catch(() => null))
    if (!parsed) continue
    parts.push(parsed)
    kept.push(it)
  }
  if (!parts.length) return null

  const rawAnalysis = await chatMultimodal(DOC_VISUAL_RULES, parts, { maxOutputTokens: 1500 })
  const arr = extractJSONArray(rawAnalysis) || []
  const elements = []
  for (const row of Array.isArray(arr) ? arr : []) {
    const idx = Number(row?.imageIndex)
    if (!Number.isInteger(idx) || idx < 0 || idx >= kept.length) continue
    const it = kept[idx]
    const el = {
      imageIndex: idx,
      page: Number(row.page) || it.page || idx + 1,
      kind: String(row.kind || 'figure'),
      label: clean(row.label),
      content: clean(row.content),
      imageId: it.id || null
    }
    if (!el.content || !el.label) continue
    elements.push(el)
  }
  if (!elements.length) return null

  // Store any pdf-rendered images so the quiz can display them, then map ids.
  const needStore = elements.filter(e => !e.imageId)
  if (needStore.length) {
    const toStore = needStore.map(e => ({ blob: kept[e.imageIndex].blob, mime: kept[e.imageIndex].mime, slideNumber: e.page, index: e.imageIndex }))
    try {
      await saveDocImages(doc.id, toStore)
      const storedAll = await listDocImages(doc.id)
      for (const e of needStore) {
        const match = storedAll.find(im => im.index === e.imageIndex && im.slideNumber === e.page)
        if (match) e.imageId = match.id
      }
    } catch { /* store may fail (e.g. capped); questions simply won't show the image */ }
  }

  try { await updateDoc(doc.id, { visualAnalysis: elements }) } catch { /* cache is best-effort */ }
  return { elements, cached: false }
}

// GLM authors mcq/short questions from the cached visual analysis. Each question
// may reference its source element's `imageIndex`, which we map to the stored
// image id so the renderer can show the figure.
async function authorVisualQuestions(doc, elements, isBanned, weakHint) {
  const prompt = visualQuestionPrompt(elements, weakHint)
  let arr
  try {
    arr = extractJSONArray(await chatJSON(prompt, { maxOutputTokens: 1024 + 128 * elements.length }))
  } catch { return [] }
  if (!Array.isArray(arr)) return []

  const optionRng = mulberry32((elements.length * 40503 + doc.id.length * 7) >>> 0)
  const out = []
  for (const row of arr) {
    const idx = row?.imageIndex != null ? Number(row.imageIndex) : null
    let imageId = null
    if (Number.isInteger(idx)) {
      const el = elements[idx]
      if (el && el.imageId) imageId = el.imageId
    }
    if (row?.kind === 'mcq') {
      const correct = clean(row.correct)
      if (!correct) continue // no answer, no question
      const ok = validateGeneratedMcq(row, correct)
      if (!ok) continue
      if (isBanned(ok.stem)) continue
      const options = shuffleArr([correct, ...ok.wrong], optionRng)
      out.push({
        type: 'mcq',
        stem: ok.stem,
        options,
        answerIndex: options.indexOf(correct),
        imageId,
        meta: { sentence: ok.stem, term: correct, docId: doc.id }
      })
    } else if (row?.kind === 'short') {
      const ok = validateGeneratedShort(row, row.answer || '')
      if (!ok) continue
      if (isBanned(ok.prompt)) continue
      out.push({
        type: 'short',
        prompt: ok.prompt,
        answer: ok.answer,
        imageId,
        meta: { sentence: ok.prompt, term: ok.answer, docId: doc.id }
      })
    }
  }
  return out
}

// Map a raw gemini failure to a short user-facing reason.
export function classifyAIError(err) {
  const msg = String(err?.message || err || '')
  if (msg === 'timeout' || msg.includes('timed out')) return 'timeout'
  if (msg === 'network_error' || msg.includes('fetch') || msg.includes('network')) return 'offline'
  if (/429|rate|quota|resource_?exhausted|throttled|all_keys/i.test(msg)) return 'quota'
  if (/api[ _]?key|permission|403|401/i.test(msg)) return 'invalid_key'
  if (/50[03]|overloaded|unavailable/i.test(msg)) return 'server_busy'
  return 'error'
}

async function requestBatch(items, relatedFor, weakHint) {
  const raw = await chatJSON(
    mcqPrompt(items, relatedFor, weakHint),
    { maxOutputTokens: 1024 + 256 * items.length }
  )
  return extractJSONArray(raw) || []
}

async function generateBatch(items, relatedFor, weakHint) {
  const arr = await requestBatch(items, relatedFor, weakHint)
  const out = new Map()
  for (const row of Array.isArray(arr) ? arr : []) {
    const i = Number(row?.i)
    if (!Number.isInteger(i)) continue
    const entry = items.find(([, idx]) => idx === i)
    if (!entry) continue
    const [q] = entry

    if (row?.kind === 'mcq') {
      const correct = clean(row.correct) || q.meta.term
      const ok = validateGeneratedMcq(row, correct)
      if (ok) out.set(i, { stem: ok.stem, wrong: ok.wrong, correct })
    } else if (row?.kind === 'id') {
      const ok = validateGeneratedClue(row, q.meta.term)
      if (ok) out.set(i, { clue: ok.clue })
    } else if (row?.kind === 'short') {
      const ok = validateGeneratedShort(row, q.meta.term)
      if (ok) out.set(i, { prompt: ok.prompt, answer: ok.answer })
    }
  }
  return out
}

export async function generateQuizAI(doc, cfg, onProgress) {
  const base = generateQuiz(doc, cfg)
  if (base.error === 'not_enough_content' || !base.questions.length) return base

  if (!hasApiKey()) {
    return { ...base, aiPolished: false, aiError: true, aiNote: 'no_key' }
  }

  const isBanned = makeBannedCheckerFromTitles(doc.name, extractTitleLines(doc.text))

  // Build a bank of the document's real key terms so the ai can ground its
  // distractors in THIS pdf's subject matter rather than inventing generic ones.
  const termBank = keyTerms(doc.text).map(r => r.term.toLowerCase())
  const stTok = s => new Set((String(s).toLowerCase().match(/[a-z0-9]{3,}/g) || []))
  const relatedFor = q => {
    const st = stTok(q.meta.sentence + ' ' + q.meta.term)
    const term = String(q.meta.term).toLowerCase()
    const scored = termBank
      .filter(t => t !== term)
      .map(t => {
        const tt = stTok(t)
        let overlap = 0
        for (const w of tt) if (st.has(w)) overlap++
        return [t, overlap]
      })
      .sort((a, b) => b[1] - a[1] || (optionRng() - 0.5))
    return scored.slice(0, 10).map(s => s[0])
  }

  // TF statements come verbatim from source sentences and FIB relies on
  // exact blanking mechanics, so those stay heuristic. MCQ, ID and short
  // answers are fully written by the ai from the already-parsed sentences/terms.
  const queue = []
  base.questions.forEach((q, i) => {
    if (q.type === 'mcq' || q.type === 'id' || q.type === 'short') queue.push([q, i])
  })

  // Weakness-aware focus: bias the ai toward the learner's weak terms.
  let weakHint = null
  if (cfg.focusWeak && Array.isArray(cfg.weakTerms) && cfg.weakTerms.length) {
    const terms = cfg.weakTerms.map(w => String(w.term || w)).filter(Boolean).slice(0, 40)
    if (terms.length) {
      weakHint = `PRIORITIZE these learner-weak terms when picking sentences to quiz (use them as the answer where possible): ${terms.join(', ')}.`
    }
  }

  // Full AI authoring: Gemini writes the whole quiz from scratch (recall +
  // comprehension + scenario questions) instead of polishing built-in drafts.
  let aiNote = null
  let authorFailed = null
  if (cfg.aiAuthor) {
    try {
      const authored = await authorFullQuiz(doc, cfg, isBanned, weakHint, onProgress)
      if (authored.questions.length >= Math.min(3, cfg.count)) {
        let final = authored.questions
        if (final.length < cfg.count) {
          const used = new Set(final.map(q => q.meta?.sentence))
          final = final.concat(
            base.questions.filter(q => !used.has(q.meta?.sentence)).slice(0, cfg.count - final.length)
          )
        }
        final = final.slice(0, cfg.count)
        if (cfg.shuffle) final = shuffleArr(final, mulberry32((base.seed ^ 0x5bf03635) >>> 0))
        return {
          questions: final,
          seed: base.seed,
          error: final.length < cfg.count ? 'partial' : null,
          aiPolished: true,
          aiNote: null
        }
      }
      // Authoring yielded too little — fall through to the polish pipeline
      // below. Remember a hard failure so the learner still gets an honest
      // "used built-in questions" note when nothing AI lands.
      if (authored.error) authorFailed = classifyAIError(authored.error)
    } catch (err) {
      authorFailed = classifyAIError(err)
    }
  }

  let done = base.questions.length - queue.length
  onProgress?.(done, base.questions.length)

  // The visual round (render pages → one multimodal analysis → question
  // authoring) shares no state with the text batches, so its entire latency
  // hides behind the polish calls instead of stacking after them.
  const visualPromise = cfg.deepVisual !== false
    ? ensureVisualAnalysis(doc)
        .then(analysis => analysis && analysis.elements?.length
          ? authorVisualQuestions(doc, analysis.elements, isBanned, weakHint).catch(() => [])
          : [])
        .catch(() => [])
    : Promise.resolve([])

  const optionRng = mulberry32((base.seed ^ 0x7a3f1d9b) >>> 0)
  const results = new Map()
  const BATCH = 6
  const batches = []
  for (let g = 0; g < queue.length; g += BATCH) batches.push(queue.slice(g, g + BATCH))
  const batchOut = await runPool(batches.map(group => () => generateBatch(group, relatedFor, weakHint)), 3)
  batchOut.forEach((gen, bi) => {
    const group = batches[bi]
    if (gen instanceof Error) {
      if (!aiNote) aiNote = classifyAIError(gen)
    } else {
      group.forEach(([q, i]) => {
        const genItem = gen.get(i)
        if (!genItem) return

        if (genItem.stem != null) {
          if (isBanned(genItem.stem)) return
          const correct = clean(genItem.correct) || q.meta.term
          const options = shuffleArr([correct, ...genItem.wrong], optionRng)
          results.set(i, { ...q, stem: genItem.stem, options, answerIndex: options.indexOf(correct), meta: { ...q.meta, term: correct } })
        } else if (genItem.clue != null) {
          if (isBanned(genItem.clue)) return
          results.set(i, { ...q, clue: genItem.clue })
        } else if (genItem.prompt != null) {
          results.set(i, { ...q, prompt: genItem.prompt, answer: genItem.answer })
        }
      })
    }
    done = Math.min(base.questions.length, done + group.length)
    onProgress?.(done, base.questions.length)
  })

  let polishedCount = 0
  const out = base.questions.map((q, i) => {
    const next = results.get(i)
    if (!next) return q
    polishedCount++
    return next
  })

  let imageQuestions = []
  try { imageQuestions = (await visualPromise) || [] } catch { /* visual round is best-effort */ }

  let final = out
  if (imageQuestions.length) final = final.concat(imageQuestions)

  // Safety net: strip any document furniture (module/topic labels, page
  // numbers, glued headings) the model copied from the source excerpts.
  final = final.map(q => {
    if (q.stem) return { ...q, stem: cleanSentence(q.stem) }
    if (q.statement) return { ...q, statement: cleanSentence(q.statement) }
    if (q.clue) return { ...q, clue: cleanSentence(q.clue) }
    return q
  })

  // Cap to the user-requested count so visual extras don't overflow.
  if (final.length > cfg.count) final = final.slice(0, cfg.count)

  if (cfg.shuffle && (polishedCount > 0 || imageQuestions.length)) {
    final = shuffleArr(final, mulberry32((base.seed ^ 0x5bf03635) >>> 0))
  }

  const aiPolished = polishedCount > 0 || imageQuestions.length > 0
  return {
    questions: final,
    seed: base.seed,
    error: final.length < cfg.count ? 'partial' : null,
    aiPolished,
    // Surface an authoring failure only when the final quiz contains no AI
    // content at all — otherwise the toast would lie about a polished quiz.
    aiNote: aiNote || (!aiPolished && authorFailed ? authorFailed : null)
  }
}

// Grade a free-text short answer against the reference using the ai. Returns
// true/false, or null when grading is unavailable (caller falls back to a
// local string check). Text-only, so always routes through the free provider.
export async function gradeShortAnswer(userAnswer, q) {
  const answer = (userAnswer || '').trim()
  if (!answer) return false
  const base = (q.answer || '').trim()
  if (!base) return checkTyped(answer, base || q.term || '')
  if (!hasApiKey()) return checkTyped(answer, base)
  try {
    const raw = await chatJSON(shortGradePrompt({ prompt: q.prompt, answer: base, userAnswer: answer }), {
      maxOutputTokens: 64,
      rules: SHORT_GRADE_RULES
    })
    // AI returns {"ok":true} or {"ok":false} — try JSON.parse first, fall back to array extraction.
    let obj = null
    try { obj = JSON.parse(raw) } catch { /* not plain JSON */ }
    if (!obj || typeof obj !== 'object') {
      const parsed = extractJSONArray(raw)
      obj = Array.isArray(parsed) ? parsed[0] : null
    }
    if (obj && typeof obj === 'object' && typeof obj.ok === 'boolean') return obj.ok
    if (obj && typeof obj.correct === 'boolean') return obj.correct
    return null
  } catch {
    return null
  }
}

// Full AI authoring: Gemini writes exam-style questions (recall +
// comprehension + scenario) straight from numbered source sentences, authored
// in parallel batches (see AUTHOR_BATCH/AUTHOR_POOL). Every item must cite its
// source ("src") and share content words with it — anything ungrounded, off-
// ban-list, or malformed is rejected. Returns { questions, error } where error
// records the first batch failure (null when every call succeeded).
async function authorFullQuiz(doc, cfg, isBanned, weakHint, onProgress) {
  const text = stripHeadings(doc.text)
  const ranked = scoreSentences(sentences(text), termFreq(text))
  if (ranked.length < 3) return { questions: [], error: null }
  // Top sentences from across the document; one question authored per
  // sentence so coverage spreads instead of clustering.
  const material = ranked.slice(0, Math.max(Math.min(cfg.count * 3, 60), 12))
  // Real concepts from the document so the model's distractors stay in-family
  // (phishing variants pair with phishing variants, not with random nouns).
  const termBank = keyTerms(text).slice(0, 40).map(r => r.term)
  const optionRng = mulberry32(hashString(String(doc.id)))
  const out = []
  const seen = new Set()
  let firstErr = null
  onProgress?.(0, cfg.count)

  const takeRows = (arr, group) => {
    for (const row of (Array.isArray(arr) ? arr : [])) {
      if (out.length >= cfg.count) break
      const src = Number(row?.src)
      if (!Number.isInteger(src) || src < 0 || src >= group.length) continue
      const source = group[src].text
      if (row?.kind === 'mcq') {
        const correct = clean(row.correct)
        const ok = correct && validateGeneratedMcq(row, correct)
        if (!ok) continue
        if (isBanned(ok.stem) || ok.wrong.some(w => isBanned(w))) continue
        if (!grounded(ok.stem + ' ' + correct, source)) continue
        const options = shuffleArr([correct, ...ok.wrong], optionRng)
        const stem = cleanSentence(ok.stem)
        if (seen.has(stem.toLowerCase())) continue
        seen.add(stem.toLowerCase())
        out.push({
          type: 'mcq',
          stem,
          options,
          answerIndex: options.indexOf(correct),
          meta: { sentence: source, term: correct, docId: doc.id, authored: true }
        })
      } else if (row?.kind === 'short') {
        const ok = validateGeneratedShort(row, clean(row.answer))
        if (!ok) continue
        if (isBanned(ok.prompt)) continue
        if (!grounded(ok.prompt + ' ' + ok.answer, source)) continue
        if (seen.has(ok.prompt.toLowerCase())) continue
        seen.add(ok.prompt.toLowerCase())
        out.push({
          type: 'short',
          prompt: ok.prompt,
          answer: ok.answer,
          meta: { sentence: source, term: ok.answer, docId: doc.id, authored: true }
        })
      }
    }
    onProgress?.(Math.min(cfg.count, out.length), cfg.count)
  }

  const authGroup = async (group) => {
    try {
      return extractJSONArray(await chatJSON(authorQuizPrompt(group, weakHint, termBank), {
        maxOutputTokens: 1024 + 384 * group.length, temperature: 0.7
      })) || []
    } catch (err) {
      if (!firstErr) firstErr = err
      return []
    }
  }

  const groups = []
  for (let i = 0; i < material.length; i += AUTHOR_BATCH) {
    groups.push(material.slice(i, i + AUTHOR_BATCH).map((s, k) => ({ i: k, text: s.text })))
  }
  const firstWave = Math.min(groups.length, Math.max(1, Math.ceil(cfg.count / AUTHOR_BATCH)))
  const waveRows = await runPool(groups.slice(0, firstWave).map(g => () => authGroup(g)), AUTHOR_POOL)
  waveRows.forEach((rows, i) => takeRows(rows, groups[i]))

  for (let g = firstWave; g < groups.length && out.length < cfg.count; g++) {
    takeRows(await authGroup(groups[g]), groups[g])
  }
  return { questions: out, error: firstErr }
}

// Anti-hallucination guard for authored questions: the question + answer
// must share at least two content words with the source sentence they claim
// to be based on. Scenario stems paraphrase heavily ("the decision is
// explainable" vs "explain decisions"), so morphological cousins count:
// exact match, a shared stem after suffix stripping, or a ≥5-char prefix
// (decision/decisions, explain/explainable, manage/management).
export function grounded(text, source) {
  const toks = s => new Set(String(s).toLowerCase().match(/[a-z0-9]{4,}/g) || [])
  const base = w => {
    const st = w.replace(/(ies|ves|es|ed|ing|s)$/, '')
    return st.length >= 4 ? st : w
  }
  const a = [...toks(text)].map(base)
  const b = [...toks(source)].map(base)
  let hits = 0
  for (const w of new Set(a)) {
    if (b.includes(w)) { hits++; continue }
    for (const v of b) {
      const min = Math.min(w.length, v.length)
      if (min >= 5 && (w.startsWith(v.slice(0, min)) || v.startsWith(w.slice(0, min)))) { hits++; break }
    }
  }
  return hits >= 2
}

// Pre-fetch one-line explanations for a whole quiz, in chunks of 20 so the
// batched response fits the token budget even for long quizzes. Mutates each
// question in place (q.explanation) as results arrive — the quiz screen shows
// them automatically in the feedback banner. Best-effort: any failure leaves
// questions without explanations and the tap-to-explain button still works.
export async function explainQuestions(questions) {
  const items = (questions || []).filter(q => q && !q.explanation &&
    (q.stem || q.statement || q.clue || q.prompt))
  if (!items.length) return
  const CHUNK = 20
  for (let g = 0; g < items.length; g += CHUNK) {
    const chunk = items.slice(g, g + CHUNK)
    try {
      const text = await chatJSON(explainBatchPrompt(chunk), {
        maxOutputTokens: 2048, temperature: 0.3, timeoutMs: 45000
      })
      let parsed = null
      try { parsed = JSON.parse(text) } catch { /* try array extraction */ }
      const list = Array.isArray(parsed?.explanations)
        ? parsed.explanations
        : extractJSONArray(text) || []
      for (const e of list) {
        const q = chunk[Number(e?.i)]
        const t = clean(e?.text)
        if (q && t) q.explanation = t.slice(0, 240)
      }
    } catch { /* best-effort per chunk */ }
  }
}

// Full AI authoring: the model writes original exam-style questions straight
// from the document's best sentences. Every item cites its source sentence so
// the result can be validated against real text; malformed, ungrounded or
// heading-touched items are dropped. When this yields too few questions the
// caller chains into the polish/built-in path.
//
// Speed: batches of AUTHOR_BATCH sentences are authored in parallel waves of
// AUTHOR_POOL calls — a 20-question quiz drops from ~7 serial round trips to
// ~2 parallel ones.
const AUTHOR_BATCH = 10
const AUTHOR_POOL = 3

export async function authorExamQuestions(doc, cfg, onProgress = () => {}) {
  const text = stripHeadings(doc.text)
  const ranked = scoreSentences(sentences(text), termFreq(text))
  if (ranked.length < 4) return { questions: [], error: 'not_enough_content' }
  const isBanned = makeBannedCheckerFromTitles(doc.name, extractTitleLines(doc.text))
  const termBank = keyTerms(text).slice(0, 40).map(r => r.term)

  const pick = ranked.slice(0, Math.min(ranked.length, Math.max(cfg.count * 2, 12)))
  const groups = []
  for (let i = 0; i < pick.length; i += AUTHOR_BATCH) {
    groups.push(pick.slice(i, i + AUTHOR_BATCH).map((s, k) => ({ i: k, text: s.text })))
  }
  const weakHint = Array.isArray(cfg.weakTerms) && cfg.weakTerms.length
    ? 'Lean toward these terms the student struggles with: ' +
      cfg.weakTerms.slice(0, 20).map(w => String(w.term || w)).join(', ')
    : ''

  const out = []
  const seen = new Set()
  onProgress(0, cfg.count)

  const takeRows = (rows, group) => {
    for (const it of (Array.isArray(rows) ? rows : [])) {
      if (out.length >= cfg.count) break
      const src = group[Number(it?.src)] || group[0]
      const sentence = src ? src.text : ''
      if (!sentence) continue
      if (it.kind === 'mcq') {
        const stem = clean(it.stem)
        const correct = clean(it.correct)
        const wrong = Array.isArray(it.wrong) ? it.wrong.map(clean).filter(Boolean) : []
        if (!stem || !correct || wrong.length !== 3) continue
        if (stem.length > 300 || isBanned(stem) || wrong.some(w => isBanned(w))) continue
        const all = [correct, ...wrong]
        if (new Set(all.map(w => w.toLowerCase())).size !== 4) continue
        if (new RegExp('\\b' + escapeRegExp(correct) + '\\b', 'i').test(stem)) continue
        const options = shuffleArr(all, mulberry32((out.length * 2654435761) >>> 0))
        const answerIndex = options.findIndex(o => o.toLowerCase() === correct.toLowerCase())
        if (answerIndex === -1) continue
        if (seen.has(stem.toLowerCase())) continue
        seen.add(stem.toLowerCase())
        out.push({ type: 'mcq', stem, options, answerIndex, meta: { sentence, term: correct } })
      } else if (it.kind === 'short') {
        const prompt = clean(it.prompt)
        const answer = clean(it.answer)
        if (!prompt || !answer || prompt.length > 300 || isBanned(prompt)) continue
        if (seen.has(prompt.toLowerCase())) continue
        seen.add(prompt.toLowerCase())
        out.push({ type: 'short', prompt, answer, meta: { sentence, term: answer } })
      }
    }
    onProgress(out.length, cfg.count)
  }

  const authGroup = async (group) => {
    const raw = await chatJSON(authorQuizPrompt(group, weakHint, termBank), {
      maxOutputTokens: 1024 + 320 * group.length, temperature: 0.5, timeoutMs: 60000
    })
    return extractJSONArray(raw) || []
  }

  // First wave: the minimum number of batches that can cover the requested
  // count, fired in parallel. Only top up sequentially when a batch under-
  // delivered (rejected stems, grounding misses).
  const firstWave = Math.min(groups.length, Math.max(1, Math.ceil(cfg.count / AUTHOR_BATCH)))
  const waveRows = await runPool(groups.slice(0, firstWave).map(g => () => authGroup(g)), AUTHOR_POOL)
  waveRows.forEach((rows, i) => takeRows(rows, groups[i]))

  for (let g = firstWave; g < groups.length && out.length < cfg.count; g++) {
    takeRows(await authGroup(groups[g]), groups[g])
  }

  return {
    questions: out,
    error: out.length ? null : 'not_enough_content',
    aiPolished: out.length > 0,
    aiNote: out.length ? null : 'author_empty'
  }
}

// Exam-practice authoring across EVERY file the exam covers, split per topic:
// one unit per doc-topic (from detectTopics' sentence membership), the
// requested count allocated equally across units (min 1 each) so the quiz
// covers each topic of each file like a properly written exam. Scenario-style
// MCQs only (EXAM_AUTHOR_RULES); rows are validated per file and tagged with
// meta.docId/docName/topic for mistake banking and topic labels.
export async function authorExamQuiz(exam, docs, opts = {}, onProgress = (done, total) => {}) {
  const total = Math.max(4, opts.count || 20)
  const weakTerms = Array.isArray(opts.weakTerms) ? opts.weakTerms : []
  const weakHint = weakTerms.length
    ? 'Lean toward these terms the student struggles with: ' +
      weakTerms.slice(0, 20).map(w => String(w.term || w)).join(', ')
    : ''

  // One unit per doc-topic with at least two supporting sentences; smaller
  // buckets merge into the doc's General unit so no material is lost.
  // detectTopics runs on the RAW text (its heading detection needs the
  // heading lines); ranked sentences come from the stripped text, so topics
  // are matched back by containment.
  const units = []
  for (const doc of docs) {
    const raw = doc.text || ''
    const text = stripHeadings(raw)
    const ranked = scoreSentences(sentences(text), termFreq(text))
    if (ranked.length < 4) continue
    const { membership } = detectTopics(raw)
    const rawEntries = [...membership.entries()]
    const topicOf = s => {
      for (const [rawSent, t] of rawEntries) {
        if (rawSent.includes(s.text) || s.text.includes(rawSent)) return t
      }
      return 'General'
    }
    const byTopic = new Map()
    for (const s of ranked) {
      const t = topicOf(s)
      if (!byTopic.has(t)) byTopic.set(t, [])
      byTopic.get(t).push(s)
    }
    const isBanned = makeBannedCheckerFromTitles(doc.name, extractTitleLines(raw))
    const termBank = keyTerms(text).slice(0, 40).map(r => r.term)
    const buckets = [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length)
    const general = []
    for (const [topic, ss] of buckets) {
      if (ss.length >= 2) units.push({ docId: doc.id, docName: doc.name, topic, sentences: ss, isBanned, termBank })
      else general.push(...ss)
    }
    if (general.length >= 2) {
      units.push({ docId: doc.id, docName: doc.name, topic: 'General', sentences: general, isBanned, termBank })
    }
  }
  if (!units.length) return { questions: [], error: 'not_enough_content' }

  // Allocate the count across units: equal share, min 1, capped by each
  // unit's material (one question per source sentence); leftover quota goes
  // to the biggest units, then to any unit that still has spare material.
  const alloc = new Array(units.length).fill(1)
  let left = total - units.length
  if (left > 0) {
    const order = units.map((u, i) => i).sort((a, b) => units[b].sentences.length - units[a].sentences.length)
    for (const i of order) { if (!left) break; const add = Math.min(left, Math.floor(units[i].sentences.length / 2)); alloc[i] += add; left -= add }
    while (left > 0) {
      let progress = false
      for (let i = 0; i < units.length && left > 0; i++) {
        if (alloc[i] < units[i].sentences.length) { alloc[i]++; left--; progress = true }
      }
      if (!progress) break
    }
  }

  const out = []
  const seen = new Set()
  onProgress(0, total)
  // per-unit intake counter shared by ALL of that unit's batches, so a unit
  // never contributes more than its allocated share
  const unitState = units.map((unit, u) => ({ taken: 0, want: alloc[u] }))

  const takeRows = (rows, unit, state) => {
    let taken = 0
    for (const it of (Array.isArray(rows) ? rows : [])) {
      if (state.taken + taken >= state.want || out.length >= total) break
      const src = unit.sentences[Number(it?.src)] || unit.sentences[0]
      const sentence = src ? src.text : ''
      if (!sentence || it.kind !== 'mcq') continue
      const stem = clean(it.stem)
      const correct = clean(it.correct)
      const wrong = Array.isArray(it.wrong) ? it.wrong.map(clean).filter(Boolean) : []
      if (!stem || !correct || wrong.length !== 3) continue
      if (stem.length > 300 || unit.isBanned(stem) || wrong.some(w => unit.isBanned(w))) continue
      const all = [correct, ...wrong]
      if (new Set(all.map(w => w.toLowerCase())).size !== 4) continue
      if (new RegExp('\\b' + escapeRegExp(correct) + '\\b', 'i').test(stem)) continue
      const options = shuffleArr(all, mulberry32((out.length * 2654435761) >>> 0))
      const answerIndex = options.findIndex(o => o.toLowerCase() === correct.toLowerCase())
      if (answerIndex === -1) continue
      if (seen.has(stem.toLowerCase())) continue
      seen.add(stem.toLowerCase())
      out.push({ type: 'mcq', stem, options, answerIndex, meta: { sentence, term: correct, docId: unit.docId, docName: unit.docName, topic: unit.topic } })
      taken++
    }
    state.taken += taken
    onProgress(out.length, total)
    return taken
  }

  const authBatch = async (unit, state, group) => {
    const raw = await chatJSON(examAuthorPrompt(group, unit.topic, weakHint, unit.termBank), {
      maxOutputTokens: 1024 + 320 * group.length, temperature: 0.5, timeoutMs: 60000
    })
    return takeRows(extractJSONArray(raw) || [], unit, state)
  }

  // Batches per unit (AUTHOR_BATCH sentences each), all fired in parallel.
  const jobs = []
  const remaining = []
  units.forEach((unit, u) => {
    const want = alloc[u]
    const pick = unit.sentences.slice(0, Math.min(unit.sentences.length, Math.max(want * 2, 4)))
    for (let i = 0; i < pick.length; i += AUTHOR_BATCH) {
      const group = pick.slice(i, i + AUTHOR_BATCH).map((s, k) => ({ i: k, text: s.text }))
      jobs.push({ unit, state: unitState[u], group })
    }
    remaining.push({ unit, state: unitState[u], next: pick.length, want })
  })
  if (!jobs.length) return { questions: [], error: 'not_enough_content' }

  await runPool(jobs.map(j => () => authBatch(j.unit, j.state, j.group)), AUTHOR_POOL)

  // Sequential top-up: units that came in under quota get one more batch.
  for (const rem of remaining) {
    while (out.length < total && rem.state.taken < rem.want && rem.next < rem.unit.sentences.length) {
      const group = rem.unit.sentences.slice(rem.next, rem.next + AUTHOR_BATCH).map((s, k) => ({ i: k, text: s.text }))
      rem.next += AUTHOR_BATCH
      await authBatch(rem.unit, rem.state, group).catch(() => 0)
    }
  }

  return {
    questions: out,
    error: out.length ? null : 'not_enough_content',
    aiPolished: out.length > 0,
    aiNote: out.length ? null : 'author_empty'
  }
}
