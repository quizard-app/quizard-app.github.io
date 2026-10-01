import { describe, it, expect } from 'vitest'
import { bubbleSheetLayout } from '../src/app/core/engine/export.js'

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
