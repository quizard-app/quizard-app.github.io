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

// Structured output contract — mirrors the quality bar of a hand-made reviewer.
const RULES = `You are an expert exam reviewer writer. Read the DOCUMENT and produce a complete exam reviewer in strict JSON — the kind a top student would write by hand.

Return JSON with exactly this shape:
{
  "title": "Main Subject & Main Subject — Exam Reviewer",
  "intro": "1-2 sentences: what the document covers overall, e.g. 'It covers two major sessions: X and Y.'",
  "parts": [
    {
      "title": "SHORT THEME IN CAPS",
      "sections": [
        {
          "num": 1,
          "heading": "Section name",
          "mustKnow": "VERY exam-worthy | Important | Good to know",
          "definition": "Term = one-line meaning that opens the section",
          "explanation": "2-4 sentences of plain-English explanation.",
          "bullets": ["Term — what it is", "Term — what it is"],
          "steps": ["Step name — what happens", "Step name — what happens"],
          "table": { "headers": ["Col A", "Col B"], "rows": [["a1", "b1"], ["a2", "b2"]] },
          "important": "The one caveat students get wrong, e.g. 'Legal ≠ automatically ethical.'",
          "example": "One concrete example or scenario from the document.",
          "memory": "Mnemonic or memory trick, e.g. 'Kant = Rules/Duty' or 'R W D E I C A'",
          "examClue": "Likely exam phrase → answer, e.g. '\"greatest number\" → Utilitarianism; \"veil of ignorance\" → Rawls'"
        }
      ]
    }
  ],
  "highYield": [
    { "label": "Topic name", "items": ["thing to memorize", "Step A → Step B → Step C"] }
  ]
}

Every field except num and heading is optional (use null or omit it), but a strong reviewer uses most of them.

RULES:
1. Cover EVERY major topic in the document, roughly in source order — do not skip or merge away content.
2. Group sections into 4-10 PARTS. A part's "title" is the short theme in CAPS only — never write the word 'PART' or a numeral, the app adds "PART <roman>" itself.
3. Number sections continuously across all parts (1, 2, 3, ...).
4. When a section introduces a concept, open it with "definition" in the exact form "Term = meaning".
5. Use "bullets" for families of similar items (malware types, phishing variants, agencies, benefits): "Term — what it is", with the bold-worthy term first and an em dash before the description.
6. Use "steps" for ordered processes (decision procedures, kill chain, incident response, sequences the exam asks to memorize): "Step name — what happens".
7. Use "table" whenever concepts contrast (frameworks, morality vs ethics vs law, organizations and their fields, attacks and the CIA property they break).
8. "important" is the trap or caveat worth flagging ("Legal ≠ automatically ethical"). "example" is one concrete scenario from the document.
9. "memory" is a mnemonic ("Kant = Rules/Duty", "R W D E I C A", "People + Knowledge + Credentials + Clout"). "examClue" maps the exact phrase the exam will use to the answer with → arrows.
10. Mark the most testable sections "mustKnow": "VERY exam-worthy" (say this for the topics the document emphasizes), "Important", or "Good to know".
11. "highYield" is the last-minute memorization sheet: one entry per big topic, items as short as possible, arrow chains for ordered sequences.
12. Use ONLY facts from the document. Do not invent content. Keep language clear and student-friendly.
13. maxOutputTokens is large — use it: be thorough, this is the student's main study material.`

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

function sanitizeReviewer(raw) {
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
      if (!explanation && !bullets.length && !steps.length) continue
      const table = (sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows) && sec.table.rows.length)
        ? { headers: sec.table.headers.map(clean).filter(Boolean), rows: sec.table.rows.map(r => Array.isArray(r) ? r.map(clean) : []).filter(r => r.length) }
        : null
      sections.push({
        num: sec.num != null ? Number(sec.num) : num,
        heading: clean(sec.heading) || `Section ${num}`,
        mustKnow: clean(sec.mustKnow) || null,
        definition: clean(sec.definition) || null,
        explanation,
        bullets,
        steps,
        table,
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
  return {
    title: clean(raw.title) || 'Exam Reviewer',
    intro: clean(raw.intro) || '',
    parts,
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
  if (Array.isArray(doc.reviewerAI) ? doc.reviewerAI.length : doc.reviewerAI?.parts?.length) {
    return { reviewer: doc.reviewerAI, cached: true }
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
      out.push(`<div class="ai-sec-head"><span class="ai-num">${e(sec.num)}</span><h4>${e(sec.heading)}</h4>${flag}</div>`)
      if (sec.definition) {
        const eq = sec.definition.indexOf('=')
        out.push(eq > 0
          ? `<p class="ai-def"><span class="ai-def-term">${e(sec.definition.slice(0, eq).trim())}</span> = ${e(sec.definition.slice(eq + 1).trim())}</p>`
          : `<p class="ai-def">${e(sec.definition)}</p>`)
      }
      if (sec.explanation) out.push(`<p class="ai-expl" data-para>${e(sec.explanation)}</p>`)
      const bullets = sec.bullets || []
      const steps = sec.steps || []
      if (bullets.length) out.push(`<ul class="ai-bullets">${bullets.map(b => `<li data-para>${termLine(b, e)}</li>`).join('')}</ul>`)
      if (steps.length) out.push(`<ol class="ai-steps">${steps.map(s => `<li data-para>${termLine(s, e)}</li>`).join('')}</ol>`)
      if (sec.table) {
        out.push(`<table class="ai-table"><thead><tr>${sec.table.headers.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${sec.table.rows.map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      }
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
        <div class="rvw-part-head"><span class="rvw-num">🔥</span><h3>High-Yield Memorization Sheet</h3></div>
        ${reviewer.highYield.map(h => `
          <div class="ai-hy">
            <div class="ai-hy-label">${e(h.label)}</div>
            <ul class="ai-bullets">${h.items.map(i => `<li data-para>${e(i)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>`)
  }
  out.push(`<p class="sum-note">AI-generated from your document — always double-check against your original source before the exam.</p>`)
  return out.join('')
}
