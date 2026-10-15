import { describe, it, expect } from 'vitest'
import { planSheet, SCENARIOS, scenarioById } from '../src/app/core/engine/sheet-synth.js'

// The renderer needs a canvas, so only the planner — the part that decides
// which circles a fake student shaded — is covered here. The drawing itself is
// verified in-app through the dev scan tester, which pushes a rendered sheet
// through the real readSheet path.

const KEY = Array.from({ length: 10 }, (_, i) => i % 4)
const allKeys = plan => plan.answers.filter(a => a >= 0)
const hit = (plan, i) => plan.multi.some(([row]) => row === i)

describe('planSheet', () => {
  it('shades the key everywhere at full accuracy', () => {
    const plan = planSheet({ itemCount: 10, key: KEY, accuracy: 1, seed: 7 })
    expect(plan.answers).toEqual(KEY)
    expect(plan.blanks).toEqual([])
    expect(plan.multi).toEqual([])
  })

  it('shades no correct answers at zero accuracy', () => {
    const key = Array.from({ length: 40 }, (_, i) => i % 4)
    const plan = planSheet({ itemCount: 40, key, accuracy: 0, seed: 7 })
    expect(plan.answers.filter((a, i) => a === key[i])).toEqual([])
  })

  it('never leaves a row double-shaded with the same letter it already had', () => {
    // a same-letter second shade is invisible to the scanner — the row would
    // read as a normal answer instead of MULTI
    for (const seed of [1, 2, 3, 99]) {
      const plan = planSheet({ itemCount: 20, key: KEY, accuracy: 0.8, multis: 5, seed })
      for (const [row, letter] of plan.multi) {
        expect(letter).not.toBe(plan.answers[row])
        expect(letter).toBeGreaterThanOrEqual(0)
        expect(letter).toBeLessThan(4)
      }
    }
  })

  it('never marks a blank row as double-shaded, and places no mark twice', () => {
    for (const seed of [1, 5, 13, 42]) {
      const plan = planSheet({ itemCount: 25, key: KEY, accuracy: 0.9, blanks: 3, multis: 4, seed })
      const blankRows = new Set(plan.blanks)
      for (const [row] of plan.multi) expect(blankRows.has(row)).toBe(false)
      const marked = plan.multi.map(([row]) => row)
      expect(new Set(marked).size).toBe(marked.length)
      // a blank row holds nothing at all
      for (const row of blankRows) expect(plan.answers[row]).toBe(-1)
      expect(plan.blanks).toHaveLength(3)
      expect(plan.multi).toHaveLength(4)
    }
  })

  it('honours blank counts even when the sheet is too small', () => {
    const plan = planSheet({ itemCount: 3, key: KEY, blanks: 5, multis: 4, seed: 2 })
    expect(plan.answers).toEqual([-1, -1, -1])
    expect(plan.multi).toEqual([])
  })

  it('is deterministic per seed and varies across seeds', () => {
    const opts = { itemCount: 30, key: KEY, accuracy: 0.7, blanks: 2, multis: 2, seed: 11 }
    expect(planSheet(opts)).toEqual(planSheet(opts))
    expect(planSheet({ ...opts, seed: 12 })).not.toEqual(planSheet(opts))
  })

  it('shades valid letters for a quiz with no answer key', () => {
    const plan = planSheet({ itemCount: 12, key: null, accuracy: 1, seed: 4 })
    for (const a of allKeys(plan)) {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(4)
    }
    expect(allKeys(plan)).toHaveLength(12)
  })
})

describe('SCENARIOS', () => {
  it('offers the conditions a phone photo actually produces', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(4)
    expect(new Set(SCENARIOS.map(s => s.id)).size).toBe(SCENARIOS.length)
    for (const s of SCENARIOS) {
      expect(s.label).toBeTruthy()
      expect(s.accuracy).toBeGreaterThan(0)
      expect(s.accuracy).toBeLessThanOrEqual(100)
      expect(Math.abs(s.rotate)).toBeLessThanOrEqual(15)
    }
    // the interesting defects have to be reachable
    expect(SCENARIOS.some(s => s.pencil)).toBe(true)
    expect(SCENARIOS.some(s => s.blanks > 0)).toBe(true)
    expect(SCENARIOS.some(s => s.multis > 0)).toBe(true)
    expect(SCENARIOS.some(s => s.noise > 0)).toBe(true)
  })

  it('falls back to the clean sheet for an unknown id', () => {
    expect(scenarioById('nope')).toBe(SCENARIOS[0])
    expect(scenarioById('messy').id).toBe('messy')
  })
})