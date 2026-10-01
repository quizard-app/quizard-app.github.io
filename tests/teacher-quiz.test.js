import { describe, it, expect, vi, beforeEach } from 'vitest'

// The gemini module is mocked: generation tests assert prompt construction
// and output normalization, not networking.
vi.mock('../src/app/core/engine/gemini.js', () => ({ chatJSON: vi.fn() }))

import { chatJSON } from '../src/app/core/engine/gemini.js'
import { generateTeacherQuiz, clampCount, normalize } from '../src/app/core/engine/teacher-quiz.js'

const GOOD_ROW = { question: 'What is photosynthesis?', options: ['Food making', 'Breathing', 'Digestion', 'Boiling'], answerIndex: 0 }

beforeEach(() => { vi.mocked(chatJSON).mockReset() })

describe('clampCount', () => {
  it('clamps into 1..50 and defaults garbage to 10', () => {
    expect(clampCount(0)).toBe(10)
    expect(clampCount(999)).toBe(50)
    expect(clampCount(-5)).toBe(1)
    expect(clampCount(25)).toBe(25)
  })
})

describe('normalize', () => {
  it('pads short option lists and drops rows without a correct option', () => {
    const out = normalize([
      { question: 'Q1', options: ['a', 'b'], answerIndex: 0 },
      { question: 'Q2', options: ['', '', '', ''], answerIndex: 2 },
      { question: 'Q3', options: ['a', 'b', 'c', 'd'], answerIndex: 1 },
    ])
    expect(out).toHaveLength(2)
    expect(out[0].options).toHaveLength(4)
    expect(out[1].question).toBe('Q3')
  })

  it('dedupes identical questions', () => {
    const out = normalize([GOOD_ROW, GOOD_ROW])
    expect(out).toHaveLength(1)
  })
})

describe('generateTeacherQuiz', () => {
  it('mode ai: sends the lesson text and returns normalized items', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([GOOD_ROW]))
    const items = await generateTeacherQuiz({ mode: 'ai', text: 'Lesson about plants.', count: 5 })
    expect(items).toHaveLength(1)
    expect(items[0].n).toBe(1)
    const prompt = vi.mocked(chatJSON).mock.calls[0][0]
    expect(prompt).toContain('Lesson about plants.')
    expect(prompt).toContain('5 new questions')
  })

  it('mode key: entries with options are used verbatim without calling the AI', async () => {
    const keyItems = [{ n: 1, question: 'What is X?', options: ['a1', 'a2', 'a3', 'a4'], answerIndex: 2 }]
    const items = await generateTeacherQuiz({ mode: 'key', text: '', keyItems, count: 1 })
    expect(chatJSON).not.toHaveBeenCalled()
    expect(items[0].question).toBe('What is X?')
    expect(items[0].answerIndex).toBe(2)
  })

  it('mode key: answer-only entries are anchored — the prompt fixes the answer', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([{ ...GOOD_ROW, question: 'What do plants use for food?' }]))
    await generateTeacherQuiz({ mode: 'key', text: '', keyItems: [{ n: 1, answer: 'Photosynthesis' }], count: 1 })
    const prompt = vi.mocked(chatJSON).mock.calls[0][0]
    expect(prompt).toContain('Photosynthesis')
    expect(prompt).toContain('correct answer is exactly that entry')
  })

  it('mode format: teacher examples ride along as style references', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([GOOD_ROW]))
    await generateTeacherQuiz({
      mode: 'format', text: 'Lesson.', count: 3,
      examples: [{ n: 1, question: 'Teacher style?', options: ['a', 'b', 'c', 'd'], answerIndex: 1 }],
    })
    const prompt = vi.mocked(chatJSON).mock.calls[0][0]
    expect(prompt).toContain('Teacher style?')
    expect(prompt).toContain('← correct')
    expect(prompt).toContain('NEW questions')
  })

  it('throws a classified error when the AI returns nothing usable', async () => {
    vi.mocked(chatJSON).mockResolvedValue('no json here')
    await expect(generateTeacherQuiz({ mode: 'ai', text: 'x', count: 5 }))
      .rejects.toMatchObject({ code: 'empty_response' })
  })
})
