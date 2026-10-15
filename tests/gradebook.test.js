import { describe, it, expect } from 'vitest'
import { buildGradebook, isStudentSheet } from '../src/app/core/engine/gradebook.js'

// ── Fixtures ──
const students = [
  { id: 's1', no: 1, name: 'Ana Reyes' },
  { id: 's2', no: 2, name: 'Ben Cruz' },
  { id: 's3', no: 3, name: 'Cara Diaz' },
]

// Deliberately newest-first, the way listQuizzes() hands them over.
const quizzes = [
  { id: 'q3', subject: 'Biology', title: 'Cell Structure', createdAt: 3000 },
  { id: 'q2', subject: 'Biology', title: 'Photosynthesis', createdAt: 2000 },
  { id: 'q1', subject: 'Biology', title: 'Cell Division', createdAt: 1000 },
]

const sheets = [
  { quizId: 'q1', studentNo: 1, studentName: 'Ana Reyes', percent: 100, correct: 20, total: 20, createdAt: 10 },
  { quizId: 'q2', studentNo: 1, studentName: 'Ana Reyes', percent: 85, correct: 17, total: 20, createdAt: 20 },
  { quizId: 'q1', studentNo: 2, studentName: 'Ben Cruz', percent: 92, correct: 18, total: 20, createdAt: 11 },
  { quizId: 'q3', studentNo: 2, studentName: 'Ben Cruz', percent: 78, correct: 15, total: 20, createdAt: 31 },
  { quizId: 'q3', studentNo: 3, studentName: 'Cara Diaz', percent: 95, correct: 19, total: 20, createdAt: 32 },
]

describe('isStudentSheet', () => {
  it('matches on roster number first', () => {
    expect(isStudentSheet({ studentNo: 2, studentName: 'Someone Else' }, students[1])).toBe(true)
    expect(isStudentSheet({ studentNo: 9, studentName: 'Ana Reyes' }, students[0])).toBe(false)
  })

  it('falls back to the name for results saved before numbers existed', () => {
    expect(isStudentSheet({ studentNo: null, studentName: 'Ana Reyes' }, students[0])).toBe(true)
    expect(isStudentSheet({ studentNo: null, studentName: 'Nobody' }, students[0])).toBe(false)
  })
})

describe('buildGradebook columns', () => {
  it('orders columns by quiz creation, not by the order quizzes were listed', () => {
    const { columns } = buildGradebook({ students, sheets, quizzes })
    expect(columns.map(c => c.quizId)).toEqual(['q1', 'q2', 'q3'])
    expect(columns.map(c => c.label)).toEqual(['Quiz 1', 'Quiz 2', 'Quiz 3'])
  })

  it('carries the full quiz name for the column header', () => {
    const { columns } = buildGradebook({ students, sheets, quizzes })
    expect(columns[0].full).toBe('Biology — Cell Division')
    expect(columns[2].full).toBe('Biology — Cell Structure')
  })

  it('only gives a column to quizzes this class has results for', () => {
    const unused = { id: 'q9', subject: 'Chemistry', title: 'Atoms', createdAt: 500 }
    const { columns } = buildGradebook({ students, sheets, quizzes: [...quizzes, unused] })
    expect(columns.map(c => c.quizId)).toEqual(['q1', 'q2', 'q3'])
  })

  it('keeps a column for a quiz deleted after its sheets were checked', () => {
    const onlyQ1 = quizzes.filter(q => q.id === 'q1')
    const { columns } = buildGradebook({ students, sheets, quizzes: onlyQ1 })
    expect(columns.map(c => c.quizId)).toEqual(['q1', 'q2', 'q3'])
    expect(columns[0].full).toBe('Biology — Cell Division')
    // the two we can no longer name are parked after it, still numbered
    expect(columns[1].full).toBe('')
    expect(columns[2].full).toBe('')
    expect(columns.map(c => c.label)).toEqual(['Quiz 1', 'Quiz 2', 'Quiz 3'])
  })

  it('is empty when the class has no results yet', () => {
    const { columns, rows } = buildGradebook({ students, sheets: [], quizzes })
    expect(columns).toEqual([])
    expect(rows).toHaveLength(3)
    expect(rows[0].cells).toEqual([])
  })

  it('survives being called with nothing at all', () => {
    expect(buildGradebook()).toEqual({ columns: [], rows: [] })
  })
})

describe('buildGradebook rows', () => {
  it('returns one row per student, in the order given', () => {
    const { rows } = buildGradebook({ students, sheets, quizzes })
    expect(rows.map(r => r.name)).toEqual(['Ana Reyes', 'Ben Cruz', 'Cara Diaz'])
    expect(rows.map(r => r.no)).toEqual([1, 2, 3])
  })

  it('aligns each row’s cells with the columns', () => {
    const { columns, rows } = buildGradebook({ students, sheets, quizzes })
    for (const row of rows) {
      expect(row.cells.map(c => c.quizId)).toEqual(columns.map(c => c.quizId))
    }
  })

  it('puts each score in the right cell', () => {
    const { rows } = buildGradebook({ students, sheets, quizzes })
    expect(rows[0].cells.map(c => c.percent)).toEqual([100, 85, 0])
    expect(rows[1].cells.map(c => c.percent)).toEqual([92, 0, 78])
    expect(rows[2].cells.map(c => c.percent)).toEqual([0, 0, 95])
  })

  it('marks an unscored cell so the template can print a dash instead of a zero', () => {
    const { rows } = buildGradebook({ students, sheets, quizzes })
    expect(rows[0].cells.map(c => c.scored)).toEqual([true, true, false])
    expect(rows[2].cells.map(c => c.scored)).toEqual([false, false, true])
  })

  it('keeps only the latest attempt per quiz', () => {
    const twice = [
      ...sheets,
      { quizId: 'q1', studentNo: 1, studentName: 'Ana Reyes', percent: 40, correct: 8, total: 20, createdAt: 99 },
    ]
    const { rows } = buildGradebook({ students, sheets: twice, quizzes })
    const ana = rows.find(r => r.name === 'Ana Reyes')
    expect(ana.cells[0]).toMatchObject({ percent: 40, correct: 8, date: 99 })
  })

  it('carries correct/total and the attempt date on a scored cell', () => {
    const { rows } = buildGradebook({ students, sheets, quizzes })
    expect(rows[0].cells[1]).toMatchObject({ percent: 85, correct: 17, total: 20, date: 20 })
  })

  it('matches old results that carry a name but no roster number', () => {
    const legacy = [{ quizId: 'q1', studentNo: null, studentName: 'Cara Diaz', percent: 70, correct: 14, total: 20, createdAt: 5 }]
    const { rows } = buildGradebook({ students, sheets: legacy, quizzes })
    const cara = rows.find(r => r.name === 'Cara Diaz')
    expect(cara.cells[0]).toMatchObject({ scored: true, percent: 70 })
    expect(rows[0].cells[0].scored).toBe(false)
  })

  it('treats a missing percent as zero instead of NaN', () => {
    const broken = [{ quizId: 'q1', studentNo: 1, studentName: 'Ana Reyes', createdAt: 1 }]
    const { rows } = buildGradebook({ students, sheets: broken, quizzes })
    expect(rows[0].cells[0]).toMatchObject({ percent: 0, correct: 0, total: 0 })
    expect(Number.isNaN(rows[0].cells[0].percent)).toBe(false)
  })

  it('ignores sheets for students who are not on the roster', () => {
    const stranger = [...sheets, { quizId: 'q1', studentNo: 99, studentName: 'Ghost', percent: 50, createdAt: 1 }]
    const { rows } = buildGradebook({ students, sheets: stranger, quizzes })
    expect(rows).toHaveLength(3)
    expect(rows.map(r => r.cells[0].percent)).toEqual([100, 92, 0])
  })
})

// ── Data-injection: heavy/edge datasets ──
describe('buildGradebook heavy injection', () => {
  it('survives a 900-sheet injection across 30 students and 30 quizzes', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: 's' + i, no: i + 1, name: 'Student ' + i }))
    const qs = Array.from({ length: 30 }, (_, i) => ({ id: 'q' + i, subject: 'Bio', title: 'T' + i, createdAt: 1000 + i }))
    const all = []
    for (const st of many) {
      for (const q of qs) {
        all.push({ quizId: q.id, studentNo: st.no, studentName: st.name, percent: 50, correct: 10, total: 20, createdAt: 100 })
      }
    }
    expect(all).toHaveLength(900)
    const { columns, rows } = buildGradebook({ students: many, sheets: all, quizzes: qs })
    expect(columns).toHaveLength(30)
    expect(rows).toHaveLength(30)
    expect(rows.every(r => r.cells.every(c => c.scored))).toBe(true)
  })

  it('handles a student list with no sheets and a gigantic sheet list with no students', () => {
    const a = buildGradebook({ students, sheets: [], quizzes })
    expect(a.rows.every(r => r.cells.length === 0)).toBe(true)
    const orphan = buildGradebook({ students: [], sheets, quizzes })
    expect(orphan.columns).toHaveLength(3)
    expect(orphan.rows).toEqual([])
  })
})
