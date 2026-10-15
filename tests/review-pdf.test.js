import { describe, it, expect } from 'vitest'
import { buildReviewPdf } from '../src/app/core/engine/export.js'

// The review PDF is the student-facing answer list: every question number from
// 1..N with the picked letter, coloured by verdict, keyed answer on the misses.
const mkQuiz = (n) => ({
  subject: 'Biology',
  title: 'Cell Structure',
  items: Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    question: `Q${i + 1}`,
    options: ['a', 'b', 'c', 'd'],
    answerIndex: i % 4,
  })),
})

const mkSheet = (answers, correct) => ({
  id: 's1', studentName: 'Ana Reyes', studentNo: 1, grade: '7', section: 'A',
  answers, correct, total: 20, percent: correct * 5, createdAt: Date.now(),
})

describe('buildReviewPdf', () => {
  it('renders one page per student with every item in the grid', async () => {
    const quiz = mkQuiz(20)
    const sheets = [
      mkSheet(Array.from({ length: 20 }, (_, i) => (i % 5 === 0 ? (i + 1) % 4 : i % 4)), 16),
      mkSheet(Array.from({ length: 20 }, () => 0), 5),
    ]
    const pdf = await buildReviewPdf(quiz, sheets)
    expect(pdf.getNumberOfPages()).toBe(2)
  })

  it('survives blank picks and a 50-item quiz on one page', async () => {
    const quiz = mkQuiz(50)
    const answers = Array.from({ length: 50 }, (_, i) => (i % 7 === 0 ? -1 : i % 4))
    const pdf = await buildReviewPdf(quiz, [mkSheet(answers, 38)])
    expect(pdf.getNumberOfPages()).toBe(1)
  })

  it('handles a sheet with no answers array at all', async () => {
    const pdf = await buildReviewPdf(mkQuiz(4), [{ ...mkSheet([], 0), answers: undefined }])
    expect(pdf.getNumberOfPages()).toBe(1)
  })
})
