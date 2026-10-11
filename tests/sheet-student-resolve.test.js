import { describe, it, expect } from 'vitest'
import { resolveSheetStudent } from '../src/app/core/engine/sheet-spec.js'

const roster = [
  { id: 'a1', name: 'Juan Cruz', classId: 'cls-a' },
  { id: 'a2', name: 'Ana Reyes', classId: 'cls-a' },
  { id: 'b1', name: 'Juan Cruz', classId: 'cls-b' },
  { id: 'b2', name: 'Rosa Lim', classId: 'cls-b' },
]

describe('resolveSheetStudent', () => {
  it('matches on the roster id wherever the student is', () => {
    // the id is authoritative: it resolves even when the name is ambiguous
    const st = resolveSheetStudent(roster, { studentId: 'b1', studentName: 'Juan Cruz' }, 'cls-a')
    expect(st).toEqual({ id: 'b1', name: 'Juan Cruz', classId: 'cls-b' })
  })

  it('falls back to a name that is unique school-wide', () => {
    const st = resolveSheetStudent(roster, { studentId: 'stale-id', studentName: 'Rosa Lim' }, 'cls-a')
    expect(st.id).toBe('b2')
  })

  it('resolves a shared name inside the class being checked', () => {
    const st = resolveSheetStudent(roster, { studentId: 'stale-id', studentName: 'Juan Cruz' }, 'cls-a')
    expect(st.id).toBe('a1')
  })

  it('leaves an ambiguous name unmatched when the session class has neither', () => {
    // wrong Juan Cruz would mean grading the wrong student's paper
    const st = resolveSheetStudent(roster, { studentId: 'stale-id', studentName: 'Juan Cruz' }, 'cls-c')
    expect(st).toBeNull()
  })

  it('matches names case-insensitively and ignoring outer whitespace', () => {
    const st = resolveSheetStudent(roster, { studentId: 'stale-id', studentName: '  rosa lim  ' }, null)
    expect(st.id).toBe('b2')
  })

  it('returns null when the QR has no student claim at all', () => {
    expect(resolveSheetStudent(roster, { studentId: null, studentName: 'Juan Cruz' }, 'cls-a')).toBeNull()
    expect(resolveSheetStudent(roster, null, 'cls-a')).toBeNull()
    expect(resolveSheetStudent(roster, { studentId: 'x', studentName: null }, 'cls-a')).toBeNull()
  })
})
