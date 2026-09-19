// AI exam reviewer: Gemini writes a structured, exam-quality reviewer from the
// uploaded document — the same shape as a hand-made study guide:
// PART I — THEME → numbered sections that open with a "Term = meaning"
// definition line, then explanations, "Term — description" bullets, numbered
// steps for processes, comparison tables, Important/Example callouts, memory
// tricks, "exam phrase → answer" clues, and a 🔥 high-yield memorization sheet.
//
// The result is cached on the document (doc.reviewerAI) so it generates once
// and re-opens instantly. Falls back cleanly: the offline summary tab stays
// available when there is no relay, no key, or the AI call fails.

import { updateDoc } from './storage.js'
import { chatJSON } from './gemini.js'

const MAX_CHARS_PER_CHUNK = 42000

// Structured output contract — mirrors the quality bar of a hand-made reviewer:
// emoji-headed sections, 🔹 sub-terms with "Meaning:" lines, ⭐⭐⭐ importance
// markers, comparison tables, IMPORTANT/MEMORY callouts, arrow mnemonics,
// 📝 identification drills and a 🎯 one-minute final review.
const RULES = `You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON — the kind a top student would write by hand to cram from.

Return JSON with exactly this shape:
{
  "title": "Main Subject — Exam Reviewer",
  "intro": "1-2 sentences: what the document covers overall.",
  "parts": [
    {
      "title": "SHORT THEME IN CAPS",
      "sections": [
        {
          "num": 1,
          "heading": "Section name",
          "stars": 3,
          "mustKnow": "VERY exam-worthy | Important | Good to know",
          "definition": "Term = one-line meaning that opens the section",
          "explanation": "2-4 sentences of plain-English explanation.",
          "terms": [
            { "term": "Sub-term name", "meaning": "Meaning: one clear line.", "bullets": ["detail — short note", "detail — short note"], "memory": "Utilitarianism = Results" }
          ],
          "bullets": ["Term — what it is", "Term — what it is"],
          "steps": ["Step name — what happens", "Step name — what happens"],
          "table": { "headers": ["Col A", "Col B"], "rows": [["a1", "b1"], ["a2", "b2"]] },
          "mnemonic": "Recognize → Gather → Identify → Consider → Generate → Evaluate → Act → Reflect",
          "important": "The one caveat students get wrong, e.g. 'Something can be legal but unethical.'",
          "example": "One concrete IT scenario from the document.",
          "memory": "Mnemonic like 'Kant = Rules/Duty' or 'U-D-V-S-R'",
          "examClue": "Likely exam phrase → answer, e.g. '\"greatest number\" → Utilitarianism'"
        }
      ]
    }
  ],
  "idQuestions": [
    { "clue": "Personal or cultural beliefs about right and wrong", "answer": "Morality" },
    { "clue": "Framework consisting of Privacy, Accuracy, Property, and Accessibility", "answer": "PAPA" }
  ],
  "finalReview": [
    "Morality = What I/our culture believe is right",
    "Utilitarianism = Outcome",
    "8 Steps = Recognize → Gather → Identify → Consider → Generate → Evaluate → Act → Reflect"
  ],
  "highYield": [
    { "label": "Topic name", "items": ["thing to memorize", "Step A → Step B → Step C"] }
  ]
}

Every field except num and heading is optional (use null or omit it), but a strong reviewer uses most of them.

RULES:
1. Cover EVERY major topic in the document, roughly in source order — do not skip or merge away content.
2. Group sections into 4-10 PARTS. A part's "title" is the short theme in CAPS only — never write the word 'PART' or a numeral, the app adds "PART <roman>" itself.
3. Number sections continuously across all parts (1, 2, 3, ...). Put "stars": 3 on the sections the exam will hammer (core lists, theories, models), 2 for supporting ones, omit for filler.
4. When a section introduces several related concepts (morality/ethics/law, the five theories, PAPA letters, attack types), use "terms": one entry per concept with "meaning" ("Meaning: ..."), optional "bullets" for its attributes (Focus/Key Question/IT Example, what shapes it), and "memory" ("Utilitarianism = Results", "PAPA = Privacy, Accuracy, Property, Accessibility").
5. Open concept sections with "definition" in the exact form "Term = meaning".
6. Use "bullets" for families of similar items: "Term — what it is", bold-worthy term first, em dash before the description.
7. Use "steps" for ordered processes: "Step name — what happens".
8. Use "table" whenever concepts contrast (morality vs ethics vs law, the five theories side by side, attacks vs CIA property). Tables beat prose for comparisons.
9. "mnemonic" is the memorize-the-order line with → arrows ("Recognize → Gather → ...") or a letter code ("U-D-V-S-R").
10. "important" flags the trap ("Something can be legal but unethical, or ethical but not legally required."). "example" is one concrete IT scenario.
11. "memory" is the section's memory trick. "examClue" maps the exact phrase the exam uses to the answer with → arrows.
12. "idQuestions" are 6-14 identification drills: "clue" describes the concept WITHOUT naming it, "answer" is the term. Pull the exam's most likely definitions.
13. "finalReview" is the one-minute cram: 6-12 lines of the form "Term = keyword" or "Model = Step A → Step B → ...".
14. "highYield" is the last-minute sheet: one entry per big topic, items as short as possible, arrow chains for sequences.
15. Use ONLY facts from the document. Do not invent content. Keep language clear and student-friendly.
16. maxOutputTokens is large — use it: be thorough, this is the student's main study material.`

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function roman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v } }
  return out
}

// "Term — description" → <b>Term</b> — description (first em dash only).
function termLine(s, e) {
  const i = s.indexOf(' — ')
  if (i < 1) return e(s)
  return `<b>${e(s.slice(0, i))}</b> — ${e(s.slice(i + 3))}`
}

export function sanitizeReviewer(raw) {
  if (!raw || !Array.isArray(raw.parts) || !raw.parts.length) return null
  const parts = []
  let num = 1
  for (const part of raw.parts) {
    if (!part || !Array.isArray(part.sections) || !part.sections.length) continue
    const sections = []
    for (const sec of part.sections) {
      const explanation = clean(sec.explanation)
      const bullets = Array.isArray(sec.bullets) ? sec.bullets.map(clean).filter(Boolean) : []
      const steps = Array.isArray(sec.steps) ? sec.steps.map(clean).filter(Boolean) : []
      const terms = Array.isArray(sec.terms)
        ? sec.terms.map(t => ({
            term: clean(t?.term),
            meaning: clean(t?.meaning).replace(/^meaning:\s*/i, ''),
            bullets: Array.isArray(t?.bullets) ? t.bullets.map(clean).filter(Boolean) : [],
            memory: clean(t?.memory) || null
          })).filter(t => t.term && (t.meaning || t.bullets.length))
        : []
      if (!explanation && !bullets.length && !steps.length && !terms.length) continue
      const table = (sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows) && sec.table.rows.length)
        ? { headers: sec.table.headers.map(clean).filter(Boolean), rows: sec.table.rows.map(r => Array.isArray(r) ? r.map(clean) : []).filter(r => r.length) }
        : null
      const stars = Number(sec.stars)
      sections.push({
        num: sec.num != null ? Number(sec.num) : num,
        heading: clean(sec.heading) || `Section ${num}`,
        mustKnow: clean(sec.mustKnow) || null,
        stars: Number.isFinite(stars) ? Math.max(0, Math.min(3, Math.round(stars))) : null,
        definition: clean(sec.definition) || null,
        explanation,
        terms,
        bullets,
        steps,
        table,
        mnemonic: clean(sec.mnemonic) || null,
        important: clean(sec.important) || null,
        example: clean(sec.example) || null,
        memory: clean(sec.memory) || null,
        examClue: clean(sec.examClue) || null
      })
      num++
    }
    if (sections.length) {
      // the app paints the roman numeral itself — strip any "PART I —" the model added
      const title = (clean(part.title) || 'PART').replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i, '') || 'PART'
      parts.push({ title, sections })
    }
  }
  if (!parts.length) return null
  const highYield = Array.isArray(raw.highYield)
    ? raw.highYield
        .map(h => ({ label: clean(h?.label), items: Array.isArray(h?.items) ? h.items.map(clean).filter(Boolean) : [] }))
        .filter(h => h.label && h.items.length)
    : []
  const idQuestions = Array.isArray(raw.idQuestions)
    ? raw.idQuestions
        .map(q => ({ clue: clean(q?.clue), answer: clean(q?.answer) }))
        .filter(q => q.clue && q.answer)
    : []
  const finalReview = Array.isArray(raw.finalReview) ? raw.finalReview.map(clean).filter(Boolean) : []
  return {
    v: 2, // schema version — v1 caches (no sub-terms/ID drills) regenerate once
    title: clean(raw.title) || 'Exam Reviewer',
    intro: clean(raw.intro) || '',
    parts,
    idQuestions,
    finalReview,
    highYield
  }
}

function chunkText(text) {
  if (text.length <= MAX_CHARS_PER_CHUNK) return [text]
  const chunks = []
  const paras = text.split(/\n{2,}/)
  let cur = ''
  for (const p of paras) {
    if ((cur + '\n\n' + p).length > MAX_CHARS_PER_CHUNK && cur) {
      chunks.push(cur)
      cur = p
    } else {
      cur = cur ? cur + '\n\n' + p : p
    }
  }
  if (cur) chunks.push(cur)
  return chunks.slice(0, 3) // cap at 3 chunks — beyond that, quality drops
}

// Generate (or return the cached) AI reviewer for a document.
// Returns { reviewer, cached } or { error }.
export async function ensureAIReviewer(doc) {
  const cached = doc.reviewerAI
  const cachedOk = Array.isArray(cached) ? cached.length : cached?.parts?.length
  // v2 = the hand-made format (sub-terms, ID drills, final review). v1 caches
  // fall through and regenerate once with the new prompt.
  if (cachedOk && cached.v === 2) {
    return { reviewer: cached, cached: true }
  }

  const source = String(doc.text || '').trim()
  if (source.length < 300) return { error: 'not_enough_content' }

  const chunks = chunkText(source)
  let reviewer = null
  for (let i = 0; i < chunks.length && !reviewer; i++) {
    const scope = chunks.length > 1
      ? `DOCUMENT (part ${i + 1} of ${chunks.length}):\n\n${chunks[i]}\n\nCover only the topics in this part.`
      : `DOCUMENT:\n\n${chunks[i]}`
    try {
      const raw = await chatJSON(`${RULES}\n\n${scope}`, {
        json: true,
        maxOutputTokens: 16000,
        temperature: 0.3,
        timeoutMs: 180000
      })
      let parsed
      try { parsed = JSON.parse(raw) } catch {
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) { try { parsed = JSON.parse(m[0]) } catch { parsed = null } }
      }
      reviewer = sanitizeReviewer(parsed)
      if (!reviewer && chunks.length > 1) {
        // retry once for this chunk before giving up on the whole document
        try {
          const retry = JSON.parse(await chatJSON(`${RULES}\n\n${scope}\n\nReturn ONLY valid JSON.`, {
            json: true, maxOutputTokens: 16000, temperature: 0.2, timeoutMs: 180000
          }))
          reviewer = sanitizeReviewer(retry)
        } catch { /* fall through */ }
      }
    } catch (e) {
      if (String(e?.message || e).includes('no_keys_configured') || String(e?.message || e).includes('origin_not_allowed')) {
        return { error: 'relay_unavailable' }
      }
      // 503/504/timeouts: try the next chunk or fall through to error
    }
  }

  if (!reviewer) return { error: 'generation_failed' }
  try { await updateDoc(doc.id, { reviewerAI: reviewer }) } catch { /* cache is best-effort */ }
  return { reviewer, cached: false }
}

// Render the AI reviewer to HTML (used by the reviewer page, sanitized input).
// Tolerates reviewers cached by the older schema (missing definition/steps/…).
export function reviewerToHtml(reviewer, esc) {
  const e = esc
  const out = []
  out.push(`
    <div class="rvw-head">
      <div class="rvw-eyebrow">✦ AI Exam Reviewer</div>
      <h1 class="rvw-title">${e(reviewer.title)}</h1>
      ${reviewer.intro ? `<p class="rvw-overview">${e(reviewer.intro)}</p>` : ''}
    </div>`)
  let partI = 0
  for (const part of reviewer.parts) {
    partI++
    const partTitle = (part.title || 'PART').replace(/^PART\s+[IVXLC\d]+\s*[—–-]?\s*/i, '') || 'PART'
    out.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">${roman(partI)}</span><h3>${e(partTitle)}</h3></div>`)
    for (const sec of part.sections) {
      out.push(`<div class="ai-sec">`)
      const flag = sec.mustKnow
        ? `<span class="ai-flag ${/VERY/i.test(sec.mustKnow) ? 'hot' : /Important/i.test(sec.mustKnow) ? 'warm' : 'cool'}">${e(sec.mustKnow)}</span>`
        : ''
      const stars = sec.stars ? '<span class="ai-stars">' + '⭐'.repeat(Math.min(3, sec.stars)) + '</span>' : ''
      out.push(`<div class="ai-sec-head"><span class="ai-num">${e(sec.num)}</span><h4>${e(sec.heading)}${stars}</h4>${flag}</div>`)
      if (sec.definition) {
        const eq = sec.definition.indexOf('=')
        out.push(eq > 0
          ? `<p class="ai-def"><span class="ai-def-term">${e(sec.definition.slice(0, eq).trim())}</span> = ${e(sec.definition.slice(eq + 1).trim())}</p>`
          : `<p class="ai-def">${e(sec.definition)}</p>`)
      }
      if (sec.explanation) out.push(`<p class="ai-expl" data-para>${e(sec.explanation)}</p>`)
      // 🔹 sub-terms: "Meaning:" line + attribute bullets + per-term memory
      for (const t of (sec.terms || [])) {
        out.push(`<div class="ai-term" data-para>`)
        out.push(`<div class="ai-term-name">🔹 ${e(t.term)}</div>`)
        if (t.meaning) {
          const m = t.meaning.replace(/^meaning:\s*/i, '')
          out.push(`<p class="ai-term-meaning"><span class="ai-term-label">Meaning:</span> ${e(m)}</p>`)
        }
        if (t.bullets && t.bullets.length) out.push(`<ul class="ai-bullets">${t.bullets.map(b => `<li data-para>${termLine(b, e)}</li>`).join('')}</ul>`)
        if (t.memory) out.push(`<div class="ai-box ai-memory"><span class="ai-box-label">Memory</span><span>${e(t.memory)}</span></div>`)
        out.push(`</div>`)
      }
      const bullets = sec.bullets || []
      const steps = sec.steps || []
      if (bullets.length) out.push(`<ul class="ai-bullets">${bullets.map(b => `<li data-para>${termLine(b, e)}</li>`).join('')}</ul>`)
      if (steps.length) out.push(`<ol class="ai-steps">${steps.map(s => `<li data-para>${termLine(s, e)}</li>`).join('')}</ol>`)
      if (sec.table) {
        out.push(`<table class="ai-table"><thead><tr>${sec.table.headers.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${sec.table.rows.map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      }
      if (sec.mnemonic) out.push(`<div class="ai-mnemonic" data-para><span class="ai-mnemonic-label">🧠 Memorize</span><span>${e(sec.mnemonic)}</span></div>`)
      if (sec.important) out.push(`<div class="ai-box ai-important" data-para><span class="ai-box-label">Important</span><span>${e(sec.important)}</span></div>`)
      if (sec.example) out.push(`<div class="ai-box ai-example" data-para><span class="ai-box-label">Example</span><span>${e(sec.example)}</span></div>`)
      if (sec.memory) out.push(`<div class="ai-box ai-memory" data-para><span class="ai-box-label">Memory trick</span><span>${e(sec.memory)}</span></div>`)
      if (sec.examClue) out.push(`<div class="ai-box ai-clue" data-para><span class="ai-box-label">Exam clue</span><span>${e(sec.examClue)}</span></div>`)
      out.push(`</div>`)
    }
    out.push(`</div>`)
  }
  const highYield = reviewer.highYield || []
  if (highYield.length) {
    out.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">🔥</span><h3>Super Important Exam Points</h3></div>
        <p class="ai-hy-intro">If you're short on study time, memorize these first:</p>
        ${highYield.map(h => `
          <div class="ai-hy">
            <div class="ai-hy-label">${e(h.label)}</div>
            <ul class="ai-bullets">${h.items.map(i => `<li data-para>${e(i)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>`)
  }
  // 📝 identification drills: "clue → Answer"
  const idQuestions = reviewer.idQuestions || []
  if (idQuestions.length) {
    out.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">📝</span><h3>Possible Identification Questions</h3></div>
        ${idQuestions.map(q => `
          <div class="ai-idq" data-para>
            <div class="ai-idq-clue">${e(q.clue)}</div>
            <div class="ai-idq-ans">→ ${e(q.answer)}</div>
          </div>`).join('')}
      </div>`)
  }
  // 🎯 one-minute final review: "Term = keyword" lines
  const finalReview = reviewer.finalReview || []
  if (finalReview.length) {
    out.push(`
      <div class="rvw-part">
        <div class="rvw-part-head"><span class="rvw-num">🎯</span><h3>One-Minute Final Review</h3></div>
        <p class="ai-hy-intro">Before your exam, remember:</p>
        ${finalReview.map(line => {
          const eq = line.indexOf('=')
          return eq > 0
            ? `<p class="ai-def" data-para><span class="ai-def-term">${e(line.slice(0, eq).trim())}</span> = ${e(line.slice(eq + 1).trim())}</p>`
            : `<p class="ai-def" data-para>${e(line)}</p>`
        }).join('')}
      </div>`)
  }
  out.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`)
  return out.join('')
}
