import { describe, it, expect } from 'vitest'
import { itemAnalysis, weakestItems, resultsCsv } from '../src/app/core/engine/reports.js'

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
    expect(lines[0]).toBe('Student,Class,Score %,Correct,Total,Date,Q1,Q2,Q3')
    expect(lines[1]).toContain('A,')
    expect(lines[1]).toContain(',A,B,C')  // Q1..Q3 letters
    expect(lines[2]).toContain(',B,B,A')  // Q1 wrong (B), Q2 correct (B), Q3 wrong (A)
    expect(lines[3]).toContain(',,A,C')   // Q1 blank → empty, Q2 shaded A, Q3 C
  })

  it('escapes names containing commas or quotes', () => {
    const csv = resultsCsv([{ ...sheets[0], studentName: 'Dela Cruz, Juan "JR"' }], items)
    expect(csv).toContain('"Dela Cruz, Juan ""JR"""')
  })
})
