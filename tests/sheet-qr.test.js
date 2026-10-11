import { describe, it, expect } from 'vitest'
import qrModule from 'qrcode-generator'
import { sheetQrPayload, parseSheetQr } from '../src/app/core/engine/sheet-spec.js'

const moduleCount = (payload, level) => {
  const qr = (qrModule.default || qrModule)(0, level)
  qr.addData(payload)
  qr.make()
  return qr.getModuleCount()
}

describe('sheetQrPayload / parseSheetQr', () => {
  it('encodes a blank sheet as a quiz-only QZ1 code', () => {
    const p = sheetQrPayload('quiz-1', null)
    expect(p).toBe('QZ1:quiz-1')
    expect(parseSheetQr(p)).toEqual({ quizId: 'quiz-1', studentId: null, studentName: null })
  })

  it('round-trips the roster student id and name in a QZ2 code', () => {
    const st = { id: 'stu-1', no: 3, name: 'Juan Dela Cruz' }
    const p = sheetQrPayload('quiz-1', st)
    expect(p).toBe('QZ2:quiz-1|stu-1|Juan Dela Cruz')
    expect(parseSheetQr(p)).toEqual({ quizId: 'quiz-1', studentId: 'stu-1', studentName: 'Juan Dela Cruz' })
  })

  it('keeps delimiter characters in names from breaking the parse', () => {
    const p = sheetQrPayload('q', { id: 's', name: 'Ana|Marie' })
    const parsed = parseSheetQr(p)
    expect(parsed.studentId).toBe('s')
    expect(parsed.studentName).toBe('Ana/Marie')
  })

  it('ignores QR codes that are not Quizard sheet codes', () => {
    expect(parseSheetQr('https://example.com')).toBeNull()
    expect(parseSheetQr('QZ2:quiz-only')).toBeNull()
    expect(parseSheetQr('')).toBeNull()
    expect(parseSheetQr(null)).toBeNull()
  })
})

// The QR is a fixed 76pt box, so a long student name must not push the module
// count so high that cells become unreadable in a phone photo. 45 modules is
// the worst case this accepts: 76 / 45 ≈ 1.7pt per cell.
describe('roster QR capacity', () => {
  it('keeps the cell size scannable for the longest realistic payload', () => {
    const payload = sheetQrPayload(
      'b'.repeat(36),
      { id: 'a'.repeat(36), name: 'Maria Cristina Bautista Dela Cruz' },
    )
    expect(moduleCount(payload, 'L')).toBeLessThanOrEqual(45)
  })

  it('stays smaller than level M would for the same payload', () => {
    const payload = sheetQrPayload('b'.repeat(36), { id: 'a'.repeat(36), name: 'Maria Cristina Bautista Dela Cruz' })
    expect(moduleCount(payload, 'L')).toBeLessThan(moduleCount(payload, 'M'))
  })
})
