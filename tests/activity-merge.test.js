import { describe, it, expect } from 'vitest'
import { mergeActivity } from '../src/app/shared/helpers.js'

const now = Date.now()
const H = 3600000
// newest-first, like listAttempts returns
const attempts = [
  { id: 'a3', docId: 'd1', docName: 'Ethics deck', date: now, percent: 100, correct: 1, total: 1, durationSec: 17 },
  { id: 'a2', docId: 'd1', docName: 'Ethics deck', date: now - 5 * 60000, percent: 50, correct: 1, total: 2, durationSec: 30 },
  { id: 'a1', docId: 'd2', docName: 'Biology deck', date: now - 2 * H, percent: 80, correct: 4, total: 5, durationSec: 90 },
  { id: 'a0', docId: 'd1', docName: 'Ethics deck', date: now - 26 * H, percent: 0, correct: 0, total: 2, durationSec: 12 }
]

describe('mergeActivity', () => {
  it('collapses same-document same-day rounds into one row', () => {
    const rows = mergeActivity(attempts)
    expect(rows).toHaveLength(3) // ethics-today, biology-today, ethics-yesterday
    const ethicsToday = rows[0]
    expect(ethicsToday.docId).toBe('d1')
    expect(ethicsToday.rounds).toBe(2)
    expect(ethicsToday.best).toBe(100)
    expect(ethicsToday.percent).toBe(100) // pill follows the best round
    expect(ethicsToday.date).toBe(now) // "last" shows the most recent round
    expect(ethicsToday.correct).toBe(1) // most recent round's details
    expect(ethicsToday.total).toBe(1)
  })

  it('keeps separate days of the same document as separate rows', () => {
    const rows = mergeActivity(attempts)
    const ethicsYesterday = rows[2]
    expect(ethicsYesterday.rounds).toBe(1)
    expect(ethicsYesterday.best).toBe(0)
    expect(ethicsYesterday.percent).toBe(0)
  })

  it('caps the list without touching the underlying order', () => {
    const many = []
    for (let i = 0; i < 30; i++) {
      many.push({ id: 'x' + i, docId: 'd' + (i % 7), docName: 'Doc ' + (i % 7), date: now - i * H, percent: 60 + i, correct: 1, total: 1, durationSec: 5 })
    }
    const rows = mergeActivity(many, 12)
    expect(rows).toHaveLength(12)
    expect(rows[0].date).toBe(now)
  })

  it('does not mutate the input attempts', () => {
    const copy = JSON.parse(JSON.stringify(attempts))
    mergeActivity(attempts)
    expect(attempts).toEqual(copy)
  })

  it('handles empty and missing input', () => {
    expect(mergeActivity([])).toEqual([])
    expect(mergeActivity(null)).toEqual([])
  })
})
