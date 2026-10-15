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

const nameKey = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()

// Split a freshly parsed roster against names already on a class: `fresh` are
// the genuinely new students (in order, with in-paste repeats collapsed so a
// double paste can't create twin students), `dupes` counts every skipped
// repeat — already on the roster, or listed twice in the same text.
export function diffRoster(students, existingNames) {
  const seen = new Set((existingNames || []).map(nameKey))
  const fresh = []
  let dupes = 0
  for (const s of students || []) {
    const key = nameKey(s?.name)
    if (seen.has(key)) { dupes++; continue }
    seen.add(key)
    fresh.push(s)
  }
  return { fresh, dupes }
}

function isGrade(s) {
  return /^(g(rade)?\s*\.?\s*)?\d{1,2}$/i.test(s)
}

function normalizeGrade(s) {
  const m = /(\d{1,2})/.exec(s)
  return m ? `Grade ${m[1]}` : s
}
