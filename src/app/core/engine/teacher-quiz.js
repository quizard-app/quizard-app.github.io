// Teacher quiz generation (PLAN.md Phase 2). Three modes:
//   'ai'     — write everything from the lesson text
//   'key'    — the teacher's answer key fixes the correct answers; entries
//              that already carry options are used VERBATIM, the AI only
//              writes the rest
//   'format' — the teacher's own MCQ examples are style references; the AI
//              copies their phrasing and conventions for new questions from
//              the lesson text
// Output items are always MCQ with exactly 4 options (bubble sheets are
// A–D by design).

import { chatJSON } from './gemini.js'
import { extractJSONArray } from './validate.js'

export const MAX_ITEMS = 50
const LESSON_LIMIT = 14000

/**
 * @param {{ mode: 'ai'|'key'|'format', text?: string, keyItems?: any[],
 *          examples?: any[], count: number, subject?: string }} opts
 */
export async function generateTeacherQuiz(opts) {
  const count = clampCount(opts.count)
  const ready = opts.mode === 'key'
    ? (opts.keyItems || []).filter(it => it.options?.length >= 2 && it.answerIndex >= 0).slice(0, count)
    : []
  const todo = count - ready.length
  if (todo <= 0) return finalize(ready, count)

  const prompt = buildPrompt({ ...opts, count: todo, skipVerbatim: ready.length })
  const raw = await chatJSON(prompt, { maxOutputTokens: 800 + 300 * todo, shape: 'array', temperature: 0.7 })
  const arr = extractJSONArray(raw) || []
  const generated = normalize(arr).slice(0, todo)
  if (!generated.length) {
    const err = new Error('The AI returned no usable questions. Try again.')
    err.code = 'empty_response'
    throw err
  }
  return finalize([...ready, ...generated], count)
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
    const question = String(row?.question || '').trim()
    if (!question) continue
    const k = question.toLowerCase().slice(0, 80)
    if (seen.has(k)) continue
    seen.add(k)
    const options = (Array.isArray(row?.options) ? row.options : []).map(o => String(o || '').trim())
    while (options.length < 4) options.push('')
    const answerIndex = Math.min(3, Math.max(0, Number.isInteger(row?.answerIndex) ? row.answerIndex : 0))
    if (!options[answerIndex]) continue
    out.push({ question, options: options.slice(0, 4), answerIndex })
  }
  return out
}

function finalize(items, count) {
  return items.slice(0, count).map((it, i) => ({
    n: i + 1,
    question: it.question,
    options: it.options.length === 4 ? it.options : [...it.options, ''].slice(0, 4),
    answerIndex: Math.min(3, Math.max(0, it.answerIndex ?? 0)),
  }))
}

function buildPrompt({ mode, text, keyItems, examples, count, skipVerbatim, subject }) {
  const parts = []
  parts.push(
    'You write multiple-choice quizzes for a teacher. Rules: ' +
    'exactly 4 options per question (A–D); exactly ONE correct option; ' +
    'plausible, same-length-ish distractors; no trick wording; grade-school to high-school reading level.' +
    (subject ? ` Subject: ${subject}.` : '') +
    ' Respond with ONLY a JSON array: ' +
    '[{"question":"...","options":["...","...","...","..."],"answerIndex":0}]'
  )
  if (text) parts.push('LESSON TEXT:\n"""\n' + String(text).slice(0, LESSON_LIMIT) + '\n"""')

  if (mode === 'key') {
    const open = (keyItems || [])
      .filter(it => !(it.options?.length >= 2 && it.answerIndex >= 0))
      .slice(0, count)
    parts.push(
      `Create ${count} questions (the quiz already has ${skipVerbatim} items from the teacher's own examples — do not duplicate them). ` +
      'One question per KEY ENTRY below. ' +
      'If an entry contains a question, use it word-for-word and only write the 4 options — the correct option must state the entry\'s answer. ' +
      'If an entry is only an answer, write a question whose correct answer is exactly that entry. ' +
      'KEY ENTRIES:\n' + open.map((it, i) => `${i + 1}. ${it.question ? it.question + ' → ' : ''}${it.answer}`).join('\n')
    )
    return parts.join('\n\n')
  }

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
