// Class-roster parser for the teacher app. Accepts pasted text or the text of
// an uploaded .txt/.csv file — one student per line, forgiving separators.
//
//   Juan Dela Cruz
//   Maria Santos, Grade 8
//   Juan Dela Cruz, 8, Sampaguita
//   Name, Grade, Section        ← header line is skipped

export function parseRoster(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const students = []
  let skipped = 0
  for (const [i, line] of lines.entries()) {
    // a first line that names the columns is a header, not a student
    if (i === 0 && /^(student\s*)?name\b/i.test(line) && /(grade|section|,|\t|;)/i.test(line)) continue
    const parts = line.split(/[\t,;]+/).map(p => p.trim())
    const name = (parts.shift() || '').replace(/\s+/g, ' ').trim()
    if (!name) { skipped++; continue }
    const rest = parts.filter(Boolean).map(p => p.replace(/\s+/g, ' ').trim())
    let grade = '', section = ''
    if (rest.length) {
      const first = rest.shift()
      if (isGrade(first)) { grade = normalizeGrade(first); section = rest.shift() || '' }
      else section = first
    }
    students.push({ name, grade, section: section || '' })
  }
  return { students, skipped }
}

function isGrade(s) {
  return /^(g(rade)?\s*\.?\s*)?\d{1,2}$/i.test(s)
}

function normalizeGrade(s) {
  const m = /(\d{1,2})/.exec(s)
  return m ? `Grade ${m[1]}` : s
}
