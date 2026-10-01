// Answer-key parser for the teacher app. Turns pasted text into key items.
// Three accepted shapes, mixed freely line-by-line except the compact form:
//
//   1. Photosynthesis                              → answer only
//   2. What do plants use for food? → Photosynthesis   → question + answer
//   1.A 2.B 3.C   or   BCADBACD…                   → compact letter keys
//
// Separators understood between question and answer: →  =>  —  –  -  =  :
// Returns { format, items: [{n, question, answer}], notes } — `notes` holds
// lines that were skipped so the UI can show what didn't parse.

const QA_SEPARATOR = /\s*(?:→|=>|—|–|=|: )\s*/
const LETTERS_ONLY = /^[A-Da-d\s]+$/

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
