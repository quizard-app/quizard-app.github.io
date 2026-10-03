// Teacher quiz generation (PLAN.md Phase 2). Three modes:
//   'ai'     — write everything from the lesson text
//   'key'    — the teacher's answer key is the spine of the quiz: one question
//              per key entry, the key's answer must survive as the correct
//              option, entries that already carry options are used VERBATIM
//   'format' — the teacher's own MCQ examples are style references; the AI
//              copies their phrasing and conventions for new questions from
//              the lesson text
// Output items are always MCQ with exactly 4 options (bubble sheets are
// A–D by design).

import { chatJSON } from './gemini.js'
import { extractJSONArray } from './validate.js'

export const MAX_ITEMS = 50
const LESSON_LIMIT = 14000
// One first attempt plus two retries for an entry whose correct option does
// not match the key. Past that the question is kept but flagged for the teacher.
const KEY_ROUNDS = 3

/**
 * @param {{ mode: 'ai'|'key'|'format', text?: string, keyItems?: any[],
 *          examples?: any[], count: number, subject?: string }} opts
 */
export async function generateTeacherQuiz(opts) {
  const count = clampCount(opts.count)
  if (opts.mode === 'key') return generateFromKey(opts, count)

  const prompt = buildPrompt({ ...opts, count })
  const raw = await chatJSON(prompt, { maxOutputTokens: 800 + 300 * count, shape: 'array', temperature: 0.7 })
  const generated = normalize(extractJSONArray(raw) || [])
  if (!generated.length) throw emptyResponse()
  return finalize(generated, count)
}

export function clampCount(n) {
  const v = Math.round(Number(n) || 0)
  return Math.max(1, Math.min(MAX_ITEMS, v || 10))
}

// pad/trim options to exactly 4, clamp the answer index, drop broken rows
export function normalize(arr) {
  const out = []
  const seen = new Set()
  for (const row of Array.isArray(arr) ? arr : []) {
    const it = cleanItem(row)
    if (!it) continue
    const k = it.question.toLowerCase().slice(0, 80)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

// One usable MCQ row, or null: question present, exactly 4 options, and a
// correct option that actually has text in it.
function cleanItem(row) {
  const question = String(row?.question || '').trim()
  if (!question) return null
  const options = (Array.isArray(row?.options) ? row.options : []).map(o => String(o || '').trim())
  while (options.length < 4) options.push('')
  const answerIndex = Math.min(3, Math.max(0, Number.isInteger(row?.answerIndex) ? row.answerIndex : 0))
  if (!options[answerIndex]) return null
  return { question, options: options.slice(0, 4), answerIndex }
}

function finalize(items, count) {
  return items.slice(0, count).map((it, i) => ({
    n: i + 1,
    question: it.question,
    options: it.options.length === 4 ? it.options : [...it.options, ''].slice(0, 4),
    answerIndex: Math.min(3, Math.max(0, it.answerIndex ?? 0)),
  }))
}

function emptyResponse() {
  const err = new Error('The AI returned no usable questions. Try again.')
  err.code = 'empty_response'
  return err
}

// ── 'key' mode: the quiz mirrors the teacher's answer key ────────────────
// A key entry carries an answer, not a question. For each entry the AI writes
// the question plus three wrong options and must place the key's answer as the
// correct one — then we CHECK that it did. A wrong answerIndex means every
// student who answered correctly is marked wrong, so it is never trusted.

const normText = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

/**
 * Does the AI's correct option actually say what the teacher's key says?
 * Exact after normalisation, or — for answers long enough to be unambiguous —
 * one contained in the other ("Data Integrity" vs "Data integrity and
 * reliability"). Short answers must match exactly: "10" and "Ten" are not the
 * same answer, and guessing would put the wrong key on a printed sheet.
 * @param {{ options?: string[], answerIndex?: number }} item
 * @param {string} answer
 */
export function matchesKeyAnswer(item, answer) {
  const want = normText(answer)
  if (!want) return false
  const got = normText(item?.options?.[item?.answerIndex])
  if (!got) return false
  if (want === got) return true
  return Math.min(want.length, got.length) >= 12 && (got.includes(want) || want.includes(got))
}

// "B" is a position on the teacher's own paper, not an answer.
function isBareLetter(answer) {
  return /^[A-Da-d]$/.test(String(answer ?? '').trim())
}

async function generateFromKey(opts, count) {
  const entries = (opts.keyItems || []).slice(0, count)
  if (!entries.length) {
    const err = new Error('Paste your answer key first.')
    err.code = 'no_key'
    throw err
  }

  const isComplete = it => it.options?.length >= 2 && it.answerIndex >= 0
  const verbatim = []
  const open = []
  entries.forEach((it, keyIndex) => {
    if (isComplete(it)) verbatim.push({ it, keyIndex, keyAnswer: String(it.answer ?? ''), origin: 'teacher', mismatch: false })
    else if (!isBareLetter(it.answer)) open.push({ entry: it, keyIndex })
  })

  if (!open.length) {
    if (!verbatim.length) {
      const err = new Error('This key is only letters (like BCADBACD) — it says which option was correct but not what the questions were, so there is nothing to write questions from. Paste the answers as words, or paste the questions with their answers.')
      err.code = 'bare_letters'
      throw err
    }
    return finalizeKeyed(verbatim, entries.length)
  }

  let pending = open.map(({ entry, keyIndex }, i) => ({ entry, keyIndex, no: i + 1, tries: 0, last: null }))
  const accepted = []

  for (let round = 0; round < KEY_ROUNDS && pending.length; round++) {
    const batch = pending
    pending = []
    const raw = await chatJSON(buildKeyPrompt({ ...opts, batch, verbatim: verbatim.length }), {
      maxOutputTokens: 500 + 260 * batch.length,
      shape: 'array',
      // a retry wants the model to copy the answer, not to be creative again
      temperature: round === 0 ? 0.7 : 0.2,
    })
    const rows = keyedRows(raw)
    for (const job of batch) {
      const row = rows.get(job.no)
      const keyAnswer = String(job.entry.answer ?? '')
      if (row && matchesKeyAnswer(row, job.entry.answer)) {
        accepted.push({ it: spread(row), keyIndex: job.keyIndex, keyAnswer, origin: 'ai', mismatch: false })
      } else {
        pending.push({ ...job, tries: job.tries + 1, last: row || job.last })
      }
    }
  }

  // ran out of attempts: keep the last one so the entry is not silently lost,
  // flagged so the teacher decides before anything is printed
  const flagged = pending
    .filter(job => job.last)
    .map(job => ({ it: spread(job.last), keyIndex: job.keyIndex, keyAnswer: String(job.entry.answer ?? ''), origin: 'ai', mismatch: true }))

  const items = [...verbatim, ...accepted, ...flagged]
  if (!items.length) throw emptyResponse()
  return finalizeKeyed(items, entries.length)
}

// Re-order the options so the correct answer does not land on the same letter
// every time. Shuffling the index list (not the strings) keeps the pairing
// exact even when two options share the same text.
function spread(item) {
  const order = [0, 1, 2, 3]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { ...item, options: order.map(i => item.options[i]), answerIndex: order.indexOf(item.answerIndex) }
}

// Keyed responses carry the entry number they answer, so a dropped or
// duplicated row cannot shift every later entry by one.
function keyedRows(raw) {
  const map = new Map()
  for (const row of extractJSONArray(raw) || []) {
    const no = Number(row?.key)
    if (!Number.isInteger(no) || map.has(no)) continue
    const it = cleanItem(row)
    if (it) map.set(no, it)
  }
  return map
}

function finalizeKeyed(rows, total) {
  return [...rows]
    .sort((a, b) => a.keyIndex - b.keyIndex)
    .slice(0, total)
    .map((r, i) => ({
      n: i + 1,
      question: r.it.question,
      options: r.it.options,
      answerIndex: r.it.answerIndex,
      keyIndex: r.keyIndex,
      keyAnswer: r.keyAnswer,
      keyOrigin: r.origin,
      keyMismatch: !!r.mismatch,
    }))
}

function buildKeyPrompt({ subject, text, batch, verbatim }) {
  const parts = []
  parts.push(
    'You write multiple-choice quizzes for a teacher — exactly one question per numbered KEY ENTRY below. ' +
    'Rules: exactly 4 options per question; exactly ONE correct option; the other three must be plausible ' +
    'but WRONG; no trick wording; grade-school to high-school reading level.' +
    (subject ? ` Subject: ${subject}.` : '') +
    ' Respond with ONLY a JSON array, one object per entry, each repeating that entry\'s number as "key": ' +
    '[{"key":1,"question":"...","options":["...","...","...","..."],"answerIndex":0}]'
  )
  if (text) parts.push('LESSON TEXT — use it to make the wrong options plausible and on-topic:\n"""\n' + String(text).slice(0, LESSON_LIMIT) + '\n"""')
  parts.push(
    `Write exactly ${batch.length} question${batch.length === 1 ? '' : 's'} — one per entry, no more, no fewer. ` +
    'The correct option must contain that entry\'s answer word for word: do not reword, shorten or rephrase it, ' +
    'and point "answerIndex" at the option that contains it. ' +
    (verbatim ? `(${verbatim} question(s) in this quiz already come from the teacher's own examples — do not duplicate them.) ` : '') +
    'KEY ENTRIES:\n' + batch.map(renderKeyEntry).join('\n')
  )
  return parts.join('\n\n')
}

function renderKeyEntry(job) {
  const { entry } = job
  const stem = entry.question
    ? `question: "${entry.question}" → correct answer: "${entry.answer}"`
    : `correct answer: "${entry.answer}"`
  if (!job.tries) return `${job.no}. ${stem}`
  const got = normText(job.last?.options?.[job.last?.answerIndex]) || 'nothing usable'
  return `${job.no}. ${stem}\n   RETRY ${job.tries}: the last attempt's correct option read "${got}". Use "${entry.answer}" exactly.`
}

function buildPrompt({ mode, text, examples, count }) {
  const parts = []
  parts.push(
    'You write multiple-choice quizzes for a teacher. Rules: ' +
    'exactly 4 options per question (A–D); exactly ONE correct option; ' +
    'plausible, same-length-ish distractors; no trick wording; grade-school to high-school reading level.' +
    ' Respond with ONLY a JSON array: ' +
    '[{"question":"...","options":["...","...","...","..."],"answerIndex":0}]'
  )
  if (text) parts.push('LESSON TEXT:\n"""\n' + String(text).slice(0, LESSON_LIMIT) + '\n"""')

  if (mode === 'format' && examples?.length) {
    parts.push(
      'The teacher writes questions in the style of these EXAMPLES. Copy their phrasing conventions, ' +
      'option style, difficulty and format precisely — but write NEW questions from the lesson text, not about the examples.\n' +
      'EXAMPLES:\n' + examples.slice(0, 8).map(renderExample).join('\n')
    )
  }
  parts.push(`Write ${count} new questions from the lesson text, covering its most important and testable ideas.`)
  return parts.join('\n\n')
}

function renderExample(it) {
  const lines = [`${it.question}`]
  it.options.forEach((o, i) => {
    lines.push(`${'ABCD'[i]}. ${o}${i === it.answerIndex ? '  ← correct' : ''}`)
  })
  return lines.join('\n')
}
