import { describe, it, expect } from 'vitest'
import { bubbleSheetLayout } from '../src/app/core/engine/export.js'
import { SHEET, frameRect, markerRects, markerCenters, bubbleCenter, qrRect, idDigitCenter, rowPitch, rowLabelRight } from '../src/app/core/engine/sheet-spec.js'

const COUNTS = [6, 8, 20, 21, 40, 50]
const box = (c, r) => ({ x0: c.x - r, x1: c.x + r, y0: c.y - r, y1: c.y + r })
const rectBox = (r) => ({ x0: r.x, x1: r.x + r.w, y0: r.y, y1: r.y + r.h })
const hits = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
const qrBox = (q) => box({ x: q.x + q.size / 2, y: q.y + q.size / 2 }, q.size / 2)
const lastRow = (count) => Math.max(...bubbleSheetLayout(count).columns.map(c => c.count)) - 1

describe('bubbleSheetLayout', () => {
  it('uses a single column for very short quizzes', () => {
    const l = bubbleSheetLayout(6)
    expect(l.single).toBe(true)
    expect(l.columns).toEqual([{ start: 1, count: 6 }])
    expect(l.rows).toBe(6)
  })

  it('splits longer quizzes into two balanced columns', () => {
    const l = bubbleSheetLayout(50)
    expect(l.single).toBe(false)
    expect(l.columns[0]).toEqual({ start: 1, count: 25 })
    expect(l.columns[1]).toEqual({ start: 26, count: 25 })
    expect(l.rows).toBe(25)
  })

  it('keeps numbering continuous across columns for odd counts', () => {
    const l = bubbleSheetLayout(21)
    expect(l.columns[0]).toEqual({ start: 1, count: 11 })
    expect(l.columns[1]).toEqual({ start: 12, count: 10 })
  })

  it('always offers four letters', () => {
    expect(bubbleSheetLayout(10).letters).toEqual(['A', 'B', 'C', 'D'])
  })
})

// The printed sheet and the scanner share this geometry, so these invariants
// are what keeps a real scan working: the four markers must be findable, and
// nothing may bleed into a bubble circle the OMR samples for ink.
describe('bubble sheet geometry', () => {
  it.each(COUNTS)('parks the four alignment squares in the page margins, clear of the frame (%i items)', count => {
    const f = frameRect(count)
    const rects = markerRects(count)
    expect(rects).toHaveLength(4)
    for (const m of rects) {
      expect(hits(box(m, SHEET.marker / 2), rectBox(f))).toBe(false)
      // printable area: a 12pt inset keeps markers off printer dead zones
      expect(m.x).toBeGreaterThanOrEqual(12)
      expect(m.x + SHEET.marker).toBeLessThanOrEqual(SHEET.W - 12)
      expect(m.y).toBeGreaterThanOrEqual(12)
      expect(m.y + SHEET.marker).toBeLessThanOrEqual(SHEET.H - 12)
    }
    // reading order TL, TR, BR, BL — the homography depends on it
    const c = markerCenters(count)
    expect(c[0].x).toBeLessThan(c[1].x); expect(c[0].y).toBeLessThan(c[3].y)
    expect(c[1].y).toBeLessThan(c[2].y); expect(c[3].x).toBeLessThan(c[2].x)
  })

  it.each(COUNTS)('keeps the QR inside the frame and clear of every bubble (%i items)', count => {
    const f = frameRect(count)
    const qr = qrRect(count)
    const q = qrBox(qr)
    expect(q.x0).toBeGreaterThan(f.x)
    expect(q.x1).toBeLessThan(f.x + f.w)
    expect(q.y0).toBeGreaterThan(f.y)
    expect(q.y1).toBeLessThan(f.y + f.h)
    for (let i = 0; i < count; i++) {
      for (let b = 0; b < 4; b++) {
        expect(hits(box(bubbleCenter(count, i, b), SHEET.circleR), q)).toBe(false)
      }
    }
  })

  it.each(COUNTS)('keeps the student-number strip below the grid and clear of the QR (%i items)', count => {
    const f = frameRect(count)
    const q = qrBox(qrRect(count))
    const gridBottom = f.y + SHEET.gridDy + lastRow(count) * rowPitch(count) + SHEET.circleR
    const stripTop = f.y + f.h - SHEET.idRowsDy[0] - SHEET.idBubbleR
    expect(stripTop).toBeGreaterThan(gridBottom)
    expect(f.y + f.h - SHEET.idLabelDy).toBeGreaterThan(gridBottom)
    for (let row = 0; row < 2; row++) {
      for (let d = 0; d <= 9; d++) {
        expect(hits(box(idDigitCenter(count, row, d), SHEET.idBubbleR), q)).toBe(false)
      }
    }
  })

  it.each(COUNTS)('leaves room under the frame for the write-in rules and a printer margin (%i items)', count => {
    const f = frameRect(count)
    // footer sits at frame bottom + 32 and + 56
    expect(f.y + f.h + 56).toBeLessThan(SHEET.H - 12)
  })

  it.each(COUNTS)('puts the row number immediately left of its first bubble (%i items)', count => {
    const columns = bubbleSheetLayout(count).columns
    columns.forEach((col, ci) => {
      const labelRight = rowLabelRight(count, ci)
      const first = bubbleCenter(count, col.start - 1, 0)
      expect(labelRight).toBeLessThan(first.x - SHEET.circleR)
      expect(first.x - SHEET.circleR - labelRight).toBeLessThan(SHEET.rowLabelPad)
    })
  })

  it('keeps the printed A–D label far below the scanner BLANK threshold', () => {
    // every bubble prints a letter at the exact point the scanner samples, so
    // the label adds a constant ink floor to all four options. readSheet calls a
    // row BLANK below 0.30 ink, so that floor has to stay far clear of it —
    // at letterR 3.4 the synthetic scan test starts failing.
    const sampleR = SHEET.circleR * SHEET.scanRadiusFrac
    expect((SHEET.letterR / sampleR) ** 2).toBeLessThan(0.15)
    expect(SHEET.letterR).toBeLessThan(SHEET.circleR * 0.3)
  })

  it('keeps both columns inside the frame with balanced margins', () => {
    for (const count of COUNTS) {
      const f = frameRect(count)
      for (let i = 0; i < count; i++) {
        for (let b = 0; b < 4; b++) {
          const { x } = bubbleCenter(count, i, b)
          expect(x - SHEET.circleR).toBeGreaterThan(f.x)
          expect(x + SHEET.circleR).toBeLessThan(f.x + f.w)
        }
      }
    }
  })
})