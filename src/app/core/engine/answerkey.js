// Answer-key parser for the teacher app. Turns pasted text into key items.
// Four accepted shapes:
//
//   1. Photosynthesis                              → answer only
//   1. B. Data Integrity                           → answer + the letter it
//      held on the teacher's own paper (kept in `answerLetter`, never merged
//      into the answer text)
//   2. What do plants use for food? → Photosynthesis   → question + answer
//   1.A 2.B 3.C   or   BCADBACD…                   → compact letter keys
//   1. What is X?                                  → full MCQ examples
//      A. wrong  *B. correct  C. wrong  D. wrong       (format 'mcq'; the
//      Answer: B                                       starred option or an
//                                                      Answer: line marks the
//                                                      correct one) — these
//                                                      drive "match my format"
//                                                      generation as style
//                                                      references
//
// Separators understood between question and answer: →  =>  —  –  -  =  :
// Returns { format, items, notes } — `notes` holds lines that were skipped so
// the UI can show what didn't parse.

const QA_SEPARATOR = /\s*(?:→|=>|—|–|=|: )\s*/
const LETTERS_ONLY = /^[A-Da-d\s]+$/
const OPTION_LINE = /^\(?([A-Da-d])[\).]\s+(.+)$/
// The shape teachers actually hand in: "1. B. Data Integrity" — optional
// number, the position the correct option had on THEIR paper, then the answer
// text. The letter belongs to the old paper's A–D, not to the answer, so it is
// split off instead of being glued on the front of the answer string.
const KEYED_LINE = /^(?:(\d{1,3})\s*[.):\-–—]\s*)?([A-Da-d])\s*[.):\-–—]\s*(.+)$/

// Recognize full MCQ example blocks: a question line, 2–6 option lines
// (A. … *B. …), and an optional "Answer: X" line. Returns { items, used }
// or null when no complete block exists.
function tryParseMcqBlocks(lines) {
  const isOptionStart = (s) => /^\*?\(?[A-Da-d][\).]\s+\S/.test(s.trim())
  const ANSWER_LINE = /^\(?(?:answer|key|sagot)\b\s*[:\-]?\s*\*?\(?([A-Da-d])\)?\)?\.?$/i
  const items = []
  const used = new Set()
  let i = 0
  while (i < lines.length) {
    if (used.has(i)) { i++; continue }
    const line = lines[i]
    const next = lines[i + 1] || ''
    if (!isOptionStart(next)) { i++; continue }
    const qm = /^(\d{1,3})\s*[.):\-–—]\s*(.+)$/.exec(line)
    const question = (qm ? qm[2] : line).trim()
    if (!question) { i++; continue }
    const n = qm ? parseInt(qm[1], 10) : null
    used.add(i)
    const opts = []
    let k = i + 1
    while (k < lines.length && opts.length < 6) {
      const t = lines[k].trim()
      const om = OPTION_LINE.exec(t.replace(/^\*/, '').trim())
      if (!om) break
      opts.push({ letter: om[1].toUpperCase(), text: om[2].trim(), starred: /^\*/.test(t) })
      used.add(k)
      k++
    }
    if (opts.length < 2) { // not a real block; release the lines
      for (let d = i; d < k; d++) used.delete(d)
      i++
      continue
    }
    let correct = opts.findIndex(o => o.starred)
    if (correct < 0 && k < lines.length) {
      const am = ANSWER_LINE.exec(lines[k].trim())
      if (am) {
        const li = opts.findIndex(o => o.letter === am[1].toUpperCase())
        if (li >= 0) correct = li
        used.add(k)
        k++
      }
    }
    items.push({ n: n || items.length + 1, question, options: opts.map(o => o.text), answerIndex: correct })
    i = k
  }
  return items.length ? { items, used } : null
}

/**
 * @returns {{ format: 'qa'|'answers'|'letters'|'keyed'|'mcq',
 *   items: { n: number, question: string, answer?: string, answerLetter?: string,
 *     options?: string[], answerIndex?: number }[],
 *   notes: string[] }}
 */
export function parseKeyText(text) {
  const raw = String(text || '')
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  // compact letter key: one line (or one block) of nothing but A–D letters
  const letters = raw.replace(/\s+/g, '')
  if (lines.length <= 2 && letters.length >= 5 && LETTERS_ONLY.test(letters)) {
    return {
      format: 'letters',
      items: letters.toUpperCase().split('').map((a, i) => ({ n: i + 1, question: '', answer: a })),
      notes: []
    }
  }

  // inline numbered letters on one line: "1.A 2.B 3.C" (matches must cover
  // most of the text so a prose line with a stray "1. A" isn't misread)
  const inline = [...raw.matchAll(/(\d{1,3})\s*[.):\-]\s*([A-Da-d])\b/g)]
  const covered = inline.reduce((s, m) => s + m[0].length, 0)
  const bare = raw.replace(/\s+/g, '').length
  if (inline.length >= 3 && covered >= bare * 0.6) {
    return {
      format: 'letters',
      items: inline.map(m => ({ n: parseInt(m[1], 10), question: '', answer: m[2].toUpperCase() })),
      notes: []
    }
  }

  const items = []
  const notes = []

  // Letter-prefixed key: only claimed when EVERY line has that shape, so a
  // single stray line falls back to the plain answer/question parsing below
  // rather than losing that entry's meaning.
  const keyed = lines.map(l => KEYED_LINE.exec(l))
  if (keyed.every(Boolean)) {
    return {
      format: 'keyed',
      items: keyed.map((m, i) => ({
        n: m[1] ? parseInt(m[1], 10) : i + 1,
        answerLetter: m[2].toUpperCase(),
        question: '',
        answer: m[3].trim(),
      })),
      notes: [],
    }
  }

  // full MCQ examples take precedence when present
  const mcq = tryParseMcqBlocks(lines)
  if (mcq) {
    for (let idx = 0; idx < lines.length; idx++) {
      if (!mcq.used.has(idx)) notes.push(lines[idx])
    }
    return { format: 'mcq', items: mcq.items, notes }
  }

  for (const line of lines) {
    let n = null
    let body = line
    const numbered = /^(\d{1,3})\s*[.):\-–—]\s*(.+)$/.exec(line)
    if (numbered) { n = parseInt(numbered[1], 10); body = numbered[2].trim() }

    let question = ''
    let answer = ''
    const sep = QA_SEPARATOR.exec(body)
    if (sep && sep.index > 0) {
      question = body.slice(0, sep.index).trim()
      answer = body.slice(sep.index + sep[0].length).trim()
    } else {
      answer = body
    }
    if (!answer || /^[\W_]+$/.test(answer)) { notes.push(line); continue }
    items.push({ n: n ?? items.length + 1, question, answer })
  }
  const withQuestions = items.filter(it => it.question).length
  return { format: withQuestions ? 'qa' : 'answers', items, notes }
}
