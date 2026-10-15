// Class gradebook: one row per roster student, one column per quiz, with the
// student's latest score in each cell. Pure functions — unit-testable without
// a browser, like reports.js.

/**
 * Does this saved result belong to this roster student? The scan carries the
 * roster number, so that is the reliable key; results saved before numbers
 * existed fall back to the name, exactly as the roster page has always matched
 * them. Kept identical here so the table and the chips never disagree.
 *
 * @param {{ studentNo?: number|null, studentName?: string }} sheet
 * @param {{ no?: number, name?: string }} student
 */
export function isStudentSheet(sheet, student) {
  return sheet.studentNo === student.no || (!sheet.studentNo && sheet.studentName === student.name)
}

/** Full quiz name, the same "subject — title" the rest of the app prints. */
export function quizName(quiz) {
  if (!quiz) return ''
  return quiz.subject + (quiz.title ? ' — ' + quiz.title : '')
}

/**
 * Builds the gradebook grid.
 *
 * @param {{
 *   students?: Array<{ id: string, no?: number, name: string }>,
 *   sheets?: Array<{ quizId: string, studentNo?: number|null, studentName?: string, percent?: number, correct?: number, total?: number, createdAt?: number }>,
 *   quizzes?: Array<{ id: string, subject?: string, title?: string, createdAt?: number }>,
 * }} input `students` must already be in roster order; rows come back in that
 *   order so the caller's sorting is the single source of truth.
 * @returns {{
 *   columns: Array<{ quizId: string, label: string, full: string }>,
 *   rows: Array<{ id: string, no?: number, name: string, cells: Array<{ quizId: string, label: string, full: string, scored: boolean, percent: number, correct: number, total: number, date: number }> }>,
 * }} `cells` is aligned index-for-index with `columns`, so the template can
 *   render a row with a single loop.
 */
export function buildGradebook({ students = [], sheets = [], quizzes = [] } = {}) {
  const byId = new Map(quizzes.map(q => [q.id, q]))

  // Only quizzes this class actually has results for get a column, otherwise
  // every quiz ever made would stretch the table with empty columns.
  const usedIds = []
  const seen = new Set()
  for (const s of sheets) {
    if (!s.quizId || seen.has(s.quizId)) continue
    seen.add(s.quizId)
    usedIds.push(s.quizId)
  }

  // Quiz creation order, so the newest quiz appends on the right. A quiz
  // deleted after its sheets were checked still gets a column, parked after
  // the ones we can still name, so those scores never disappear.
  const order = new Map(usedIds.map((id, i) => [id, i]))
  const columns = usedIds
    .slice()
    .sort((a, b) => {
      const qa = byId.get(a)
      const qb = byId.get(b)
      if (!qa !== !qb) return qa ? -1 : 1
      if (qa && qb) {
        const at = (qa.createdAt || 0) - (qb.createdAt || 0)
        if (at) return at
      }
      return order.get(a) - order.get(b)
    })
    .map((id, i) => {
      const quiz = byId.get(id)
      return { quizId: id, label: 'Quiz ' + (i + 1), full: quizName(quiz) }
    })

  const rows = students.map(st => {
    // Newest first, so the first hit per quiz is the latest attempt.
    const mine = sheets
      .filter(s => isStudentSheet(s, st))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    const cells = columns.map(col => {
      const hit = mine.find(s => s.quizId === col.quizId)
      return {
        quizId: col.quizId,
        label: col.label,
        full: col.full,
        scored: !!hit,
        percent: hit ? Number(hit.percent) || 0 : 0,
        correct: hit ? Number(hit.correct) || 0 : 0,
        total: hit ? Number(hit.total) || 0 : 0,
        date: hit ? hit.createdAt || 0 : 0,
      }
    })

    return { id: st.id, no: st.no, name: st.name, cells }
  })

  return { columns, rows }
}
