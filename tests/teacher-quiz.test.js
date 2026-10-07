import { describe, it, expect, vi, beforeEach } from 'vitest'

// The gemini module is mocked: generation tests assert prompt construction
// and output normalization, not networking.
vi.mock('../src/app/core/engine/gemini.js', () => ({ chatJSON: vi.fn() }))

import { chatJSON } from '../src/app/core/engine/gemini.js'
import { generateTeacherQuiz, clampCount, normalize, matchesKeyAnswer } from '../src/app/core/engine/teacher-quiz.js'
import { parseKeyText } from '../src/app/core/engine/answerkey.js'

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

describe('matchesKeyAnswer', () => {
  it('accepts the same answer regardless of case and punctuation', () => {
    expect(matchesKeyAnswer({ options: ['Data-Integrity!', 'x'], answerIndex: 0 }, 'data integrity')).toBe(true)
  })

  it('accepts a longer option that contains the key wording', () => {
    expect(matchesKeyAnswer({ options: ['Data integrity and reliability'], answerIndex: 0 }, 'Data Integrity')).toBe(true)
  })

  it('rejects a paraphrase', () => {
    expect(matchesKeyAnswer({ options: ['Integrity of data', 'x'], answerIndex: 0 }, 'Data Integrity')).toBe(false)
  })

  it('rejects an empty key answer or an empty option', () => {
    expect(matchesKeyAnswer({ options: ['a', 'b'], answerIndex: 0 }, '')).toBe(false)
    expect(matchesKeyAnswer({ options: ['Data Integrity', ''], answerIndex: 1 }, 'Data Integrity')).toBe(false)
  })

  it('still matches very short answers like "10"', () => {
    expect(matchesKeyAnswer({ options: ['10'], answerIndex: 0 }, '10')).toBe(true)
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

describe('generateTeacherQuiz — anchored to the teacher key', () => {
  const ANSWERS = ['Data Integrity', 'Confidentiality', 'Professional Ethics']
  const keyItems = ANSWERS.map((answer, i) => ({ n: i + 1, answerLetter: 'ABCD'[i], question: '', answer }))

  // Replies to whichever entries the prompt lists, reading the wanted answer
  // back out of each entry line — i.e. what a compliant model would do.
  const answerEveryEntry = () => vi.mocked(chatJSON).mockImplementation(async (prompt) => {
    const lines = prompt.split('KEY ENTRIES:')[1].trim().split('\n').filter(l => /^\d+\./.test(l))
    const rows = lines.map((line, i) => {
      const m = /(\d+)\.\s*(?:question: "([^"]*)" → )?correct answer: "([^"]+)"/.exec(line)
      return {
        key: Number(m[1]),
        question: 'Q' + (i + 1) + '?',
        options: [m[3], 'wrong one', 'wrong two', 'wrong three'],
        answerIndex: 0,
      }
    })
    return JSON.stringify(rows)
  })

  it('writes exactly one question per key entry, however many were requested', async () => {
    answerEveryEntry()
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems, count: 20 })
    expect(quiz).toHaveLength(3)
    expect(quiz.map(it => it.n)).toEqual([1, 2, 3])
    expect(chatJSON).toHaveBeenCalledTimes(1)
  })

  it('keeps the key answer as the correct option even when options are re-ordered', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([{
      key: 1, question: 'Q?', options: ['wrong one', 'Data Integrity', 'wrong two', 'wrong three'], answerIndex: 1,
    }]))
    const [it] = await generateTeacherQuiz({ mode: 'key', keyItems: [keyItems[0]], count: 1 })
    expect(it.options[it.answerIndex]).toBe('Data Integrity')
  })

  it('spreads the correct answer across A–D instead of clustering it', async () => {
    answerEveryEntry()
    const seen = new Set()
    for (let run = 0; run < 8; run++) {
      const quiz = await generateTeacherQuiz({ mode: 'key', keyItems, count: 3 })
      for (const it of quiz) seen.add(it.answerIndex)
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('retries an entry whose correct option does not match the key answer', async () => {
    vi.mocked(chatJSON)
      .mockResolvedValueOnce(JSON.stringify([{
        key: 1, question: 'Q?', options: ['Integrity of data', 'w1', 'w2', 'w3'], answerIndex: 0,
      }]))
      .mockResolvedValueOnce(JSON.stringify([{
        key: 1, question: 'Q?', options: ['Data Integrity', 'w1', 'w2', 'w3'], answerIndex: 0,
      }]))
    const [it] = await generateTeacherQuiz({ mode: 'key', keyItems: [keyItems[0]], count: 1 })
    expect(chatJSON).toHaveBeenCalledTimes(2)
    // the retry quotes the wanted answer back at the model
    expect(chatJSON.mock.calls[1][0]).toContain('Data Integrity')
    expect(it.options[it.answerIndex]).toBe('Data Integrity')
    expect(it.keyMismatch).toBe(false)
  })

  it('keeps an entry that never matched but flags it, instead of grading silently', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([{
      key: 1, question: 'Q?', options: ['Integrity of data', 'w1', 'w2', 'w3'], answerIndex: 0,
    }]))
    const [it] = await generateTeacherQuiz({ mode: 'key', keyItems: [keyItems[0]], count: 1 })
    expect(chatJSON).toHaveBeenCalledTimes(3) // first try + 2 retries
    expect(it.keyAnswer).toBe('Data Integrity')
    expect(it.keyMismatch).toBe(true)
  })

  it('never hands the model the letter prefix as part of the answer', async () => {
    answerEveryEntry()
    await generateTeacherQuiz({ mode: 'key', keyItems, count: 3 })
    const prompt = chatJSON.mock.calls[0][0]
    expect(prompt).toContain('Data Integrity')
    expect(prompt).not.toMatch(/B\.\s*Data Integrity/)
  })

  it('carries every question back to the key entry it came from, in key order', async () => {
    answerEveryEntry()
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems, count: 3 })
    expect(quiz.map(it => it.keyIndex)).toEqual([0, 1, 2])
    expect(quiz.map(it => it.keyAnswer)).toEqual(ANSWERS)
  })

  it('keeps verbatim entries in key order alongside generated ones', async () => {
    vi.mocked(chatJSON).mockResolvedValue(JSON.stringify([{
      key: 1, question: 'Q2?', options: ['Confidentiality', 'w1', 'w2', 'w3'], answerIndex: 0,
    }]))
    const mixed = [
      { n: 1, question: 'Teacher wrote this', options: ['a', 'b', 'c', 'd'], answerIndex: 1 },
      { n: 2, question: '', answer: 'Confidentiality' },
    ]
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems: mixed, count: 2 })
    expect(quiz.map(it => it.n)).toEqual([1, 2])
    expect(quiz[0].question).toBe('Teacher wrote this')
    expect(quiz[0].answerIndex).toBe(1) // untouched — verbatim means verbatim
    expect(quiz[1].options[quiz[1].answerIndex]).toBe('Confidentiality')
  })

  it('turns a letters-only key into a scoring grid — no AI, no questions', async () => {
    const letters = [{ n: 1, question: '', answer: 'B' }, { n: 2, question: '', answer: 'C' }]
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems: letters, count: 2 })
    expect(quiz).toHaveLength(2)
    expect(quiz.map(it => it.n)).toEqual([1, 2])
    expect(quiz[0].question).toBe('')
    expect(quiz[0].options.every(o => o === '')).toBe(true)
    expect(quiz[0].answerIndex).toBe(1) // B
    expect(quiz[1].answerIndex).toBe(2) // C
    expect(quiz[0].keyAnswer).toBe('B')
    expect(chatJSON).not.toHaveBeenCalled()
  })

  it('keeps bare-letter entries as grid rows in a mixed key — nothing is dropped', async () => {
    answerEveryEntry()
    const mixed = [keyItems[0], { n: 2, question: '', answer: 'C' }]
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems: mixed, count: 2 })
    expect(quiz).toHaveLength(2)
    expect(quiz.map(it => it.n)).toEqual([1, 2])
    expect(quiz[0].keyAnswer).toBe('Data Integrity')
    expect(quiz[1].question).toBe('')
    expect(quiz[1].answerIndex).toBe(2) // C
  })

  // the whole chain a teacher actually walks: paste "1. B. Data Integrity",
  // get a quiz whose correct options really are their answers
  it('turns a pasted 1. B. <answer> key into a verified quiz', async () => {
    const pasted = '1. B. Data Integrity\n2. C. Confidentiality\n3. A. Professional Ethics\n4. D. Accountability'
    const parsed = parseKeyText(pasted)
    expect(parsed.format).toBe('keyed')
    expect(parsed.items.map(i => i.answer)).toEqual(ANSWERS.slice(0, 3).concat('Accountability'))

    answerEveryEntry()
    const quiz = await generateTeacherQuiz({ mode: 'key', keyItems: parsed.items, count: 20 })

    // one question per entry even though 20 were asked for
    expect(quiz).toHaveLength(4)
    for (const [i, it] of quiz.entries()) {
      expect(it.keyAnswer).toBe(parsed.items[i].answer)
      expect(it.options[it.answerIndex]).toBe(parsed.items[i].answer)
      expect(it.keyMismatch).toBe(false)
    }
  })
})
