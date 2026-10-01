// Class results reporting (PLAN.md Phase 4): item analysis and CSV export
// over saved sheet results. Pure functions — unit-testable without a browser.

/**
 * Per-question miss rates across a set of checked sheets.
 * @param {{ answers: number[] }[]} sheets checked sheets (newest first or any order)
 * @param {{ n: number, question: string, answerIndex: number }[]} items quiz key items
 * @returns {{ n: number, question: string, correct: number, attempted: number,
 *   answered: number, missRate: number }[]}
 */
export function itemAnalysis(sheets, items) {
  const rows = items.map((it, i) => ({
    n: i + 1,
    question: it.question || '',
    correct: 0,
    attempted: 0, // shaded an answer (not blank)
    answered: 0,  // sheets that reached this item's class run (same as attempted here)
    total: sheets.length,
    missRate: 0,
  }))
  for (const s of sheets) {
    items.forEach((_, i) => {
      const a = s.answers?.[i]
      if (a == null || a < 0) return // blank — not attempted
      rows[i].attempted++
      if (a === items[i].answerIndex) rows[i].correct++
    })
  }
  for (const r of rows) {
    r.answered = r.attempted
    r.missRate = r.attempted ? Math.round(((r.attempted - r.correct) / r.attempted) * 100) : 0
  }
  return rows
}

/** The most-missed questions first (only items someone attempted). */
export function weakestItems(sheets, items, limit = 5) {
  return itemAnalysis(sheets, items)
    .filter(r => r.attempted > 0)
    .sort((a, b) => b.missRate - a.missRate || a.n - b.n)
    .slice(0, limit)
}

const CSV_ESC = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/**
 * Class results as CSV: one row per checked sheet, then per-item columns.
 * @param {{ studentName: string, className: string, percent: number,
 *   correct: number, total: number, createdAt: number, answers: number[] }[]} sheets
 * @param {{ answerIndex: number }[]} items
 */
export function resultsCsv(sheets, items) {
  const head = ['Student', 'Class', 'Score %', 'Correct', 'Total', 'Date',
    ...items.map((_, i) => `Q${i + 1}`)]
  const rows = sheets.map(s => [
    s.studentName, s.className, s.percent, s.correct, s.total,
    new Date(s.createdAt).toLocaleString(),
    ...items.map((_, i) => {
      const a = s.answers?.[i]
      return a == null || a < 0 ? '' : 'ABCD'[a]
    }),
  ])
  return [head, ...rows].map(r => r.map(CSV_ESC).join(',')).join('\r\n')
}
