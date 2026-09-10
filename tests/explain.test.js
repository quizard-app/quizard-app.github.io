import { describe, it, expect, vi } from 'vitest'

// explain.js pulls in gemini.js (which touches browser globals at runtime),
// so stub the network layer before importing.
vi.mock('../src/app/core/engine/gemini.js', () => ({
  chatJSON: vi.fn(),
  chatMultimodal: vi.fn()
}))

import { explainPayload, explainAnswer } from '../src/app/core/engine/explain.js'
import { chatJSON } from '../src/app/core/engine/gemini.js'

describe('explainPayload', () => {
  it('builds an MCQ payload with options', () => {
    const q = { type: 'mcq', statement: 'What is 2+2?', options: ['3', '4', '5'], answerIndex: 1 }
    expect(explainPayload(q, '3')).toEqual({
      stem: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: '4',
      userAnswer: '3'
    })
  })

  it('handles true/false', () => {
    const q = { type: 'tf', statement: 'The sky is blue.', answer: true }
    const p = explainPayload(q, 'False')
    expect(p.options).toEqual(['True', 'False'])
    expect(p.correctAnswer).toBe('true')
  })

  it('handles identify questions', () => {
    const q = { type: 'id', statement: 'Capital of France?', answer: 'Paris' }
    const p = explainPayload(q, 'Lyon')
    expect(p.options).toBeNull()
    expect(p.correctAnswer).toBe('Paris')
    expect(p.userAnswer).toBe('Lyon')
  })

  it('treats missing user answer as null', () => {
    const q = { type: 'tf', statement: 'X', answer: false }
    expect(explainPayload(q).userAnswer).toBeNull()
  })

  it('passes options through for except questions', () => {
    const q = { type: 'except', stem: 'All true EXCEPT:', options: ['a', 'b', 'c', 'd'], answerIndex: 2 }
    const p = explainPayload(q, 'a')
    expect(p.options).toEqual(['a', 'b', 'c', 'd'])
    expect(p.correctAnswer).toBe('c')
  })

  it('joins both answers for multi-select questions', () => {
    const q = { type: 'multi', stem: 'Pick two.', options: ['a', 'b', 'c', 'd', 'e'], answerIndices: [1, 3] }
    const p = explainPayload(q, 'a · c')
    expect(p.options).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(p.correctAnswer).toBe('b · d')
  })
})

describe('explainAnswer', () => {
  it('extracts explanation from a JSON response', async () => {
    chatJSON.mockResolvedValueOnce(JSON.stringify({ explanation: '  Because 2+2 is 4.  ' }))
    const q = { type: 'mcq', statement: 'What is 2+2?', options: ['3', '4', '5'], answerIndex: 1 }
    const text = await explainAnswer(q, '3')
    expect(text).toBe('Because 2+2 is 4.')
  })

  it('falls back to raw text when not valid JSON', async () => {
    chatJSON.mockResolvedValueOnce('  The mitochondria is the powerhouse.  ')
    const q = { type: 'id', statement: 'Powerhouse of the cell?', answer: 'Mitochondria' }
    const text = await explainAnswer(q, null)
    expect(text).toBe('The mitochondria is the powerhouse.')
  })
})
