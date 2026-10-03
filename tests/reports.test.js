import { describe, it, expect } from 'vitest'
import { itemAnalysis, weakestItems, resultsCsv, sectionBreakdown } from '../src/app/core/engine/reports.js'

const items = [
  { n: 1, question: 'Q1', answerIndex: 0 },
  { n: 2, question: 'Q2', answerIndex: 1 },
  { n: 3, question: 'Q3', answerIndex: 2 },
]

const sheets = [
  { answers: [0, 1, 2], studentName: 'A' },   // all correct
  { answers: [1, 1, 0], studentName: 'B' },   // Q1 wrong, Q3 wrong
  { answers: [-1, 0, 2], studentName: 'C' },  // Q1 blank, Q2 wrong
]

describe('itemAnalysis', () => {
  it('computes per-question miss rates', () => {
    const rows = itemAnalysis(sheets, items)
    expect(rows).toHaveLength(3)
    // Q1: 2 attempted (A correct, B wrong, C blank) → 50% miss
    expect(rows[0]).toMatchObject({ n: 1, attempted: 2, correct: 1, missRate: 50 })
    // Q2: 3 attempted, 2 correct (A and B) → 33% miss
    expect(rows[1].attempted).toBe(3)
    expect(rows[1].correct).toBe(2)
    expect(rows[1].missRate).toBe(33)
    // Q3: 3 attempted (A and C correct) → 33% miss
    expect(rows[2]).toMatchObject({ attempted: 3, correct: 2, missRate: 33 })
  })

  it('handles empty sheets', () => {
    const rows = itemAnalysis([], items)
    expect(rows[0].attempted).toBe(0)
    expect(rows[0].missRate).toBe(0)
  })
})

describe('weakestItems', () => {
  it('ranks most-missed questions first', () => {
    const weak = weakestItems(sheets, items)
    expect(weak.map(w => w.n)).toEqual([1, 2, 3])
  })

  it('limits the list', () => {
    expect(weakestItems(sheets, items, 1)).toHaveLength(1)
  })
})

describe('resultsCsv', () => {
  it('builds a header plus one row per sheet with letter answers', () => {
    const csv = resultsCsv(sheets, items)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('No,Student,Grade,Section,Class,Score %,Correct,Total,Date,Q1,Q2,Q3')
    expect(lines[1]).toContain('A,')
    expect(lines[1]).toContain(',A,B,C')  // Q1..Q3 letters
    expect(lines[2]).toContain(',B,B,A')  // Q1 wrong (B), Q2 correct (B), Q3 wrong (A)
    expect(lines[3]).toContain(',,A,C')   // Q1 blank → empty, Q2 shaded A, Q3 C
  })

  it('leaves the new identity columns blank for results saved before they existed', () => {
    const csv = resultsCsv([{ ...sheets[0], className: '7-A' }], items)
    const row = csv.split('\r\n')[1]
    // No is empty, then Student, then two empty identity columns, then the class
    expect(row.startsWith(',A,,,7-A,')).toBe(true)
  })

  it('writes the student number, grade and section when the scan carried them', () => {
    const csv = resultsCsv([
      { ...sheets[0], className: '7-A', studentNo: 12, grade: 'Grade 7', section: 'Sampaguita' },
    ], items)
    const row = csv.split('\r\n')[1]
    expect(row.startsWith('12,A,Grade 7,Sampaguita,7-A,')).toBe(true)
  })

  it('escapes names containing commas or quotes', () => {
    const csv = resultsCsv([{ ...sheets[0], studentName: 'Dela Cruz, Juan "JR"' }], items)
    expect(csv).toContain('"Dela Cruz, Juan ""JR"""')
  })
})

describe('sectionBreakdown', () => {
  const roll = [
    { studentName: 'A', section: 'Sampaguita', percent: 90 },
    { studentName: 'B', section: 'Sampaguita', percent: 70 },
    { studentName: 'C', section: 'Mabini', percent: 50 },
    { studentName: 'D', section: '', percent: 100 },      // blank section — skipped
    { studentName: 'E', section: undefined, percent: 40 }, // pre-existing record — skipped
  ]

  it('groups scores by section with average, high and low', () => {
    expect(sectionBreakdown(roll)).toEqual([
      { section: 'Mabini', count: 1, avg: 50, highest: 50, lowest: 50 },
      { section: 'Sampaguita', count: 2, avg: 80, highest: 90, lowest: 70 },
    ])
  })

  it('skips sheets with no section rather than inventing a bucket', () => {
    const rows = sectionBreakdown([{ studentName: 'A', percent: 100 }])
    expect(rows).toEqual([])
  })

  it('returns an empty list for an empty class', () => {
    expect(sectionBreakdown([])).toEqual([])
  })

  it('treats a missing percent as zero instead of NaN', () => {
    const rows = sectionBreakdown([{ section: 'A', percent: undefined }, { section: 'A', percent: 100 }])
    expect(rows[0]).toMatchObject({ count: 2, avg: 50, lowest: 0 })
  })
})
