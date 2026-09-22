import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

// authorExamQuiz pulls gemini.js (network) + storage.js (idb via quizgen chain)
// — stub the network; idb is backed by fake-indexeddb like the other suites.
vi.mock('../src/app/core/engine/gemini.js', () => ({
  hasApiKey: () => true,
  chatJSON: vi.fn(),
  chatMultimodal: vi.fn()
}))

import { authorExamQuiz } from '../src/app/core/engine/quiz-ai.js'
import { buildExamQuiz } from '../src/app/core/engine/exam.js'
import { chatJSON } from '../src/app/core/engine/gemini.js'

// Two "files", each with two heading-seeded topics (detectTopics assigns
// sentences to headings by keyword overlap).
const DOC_A = [
  'Ethics Principles Notes',
  'Explicability and Justice',
  'Explicability asks whether people can understand how a decision was reached.',
  'Justice concerns the fair distribution of benefits and risks across groups.',
  'Explicability supports accountability when an automated system affects a person.',
  'Justice requires that no group unfairly carries most of the risks of automation.',
  'Malware Attacks',
  'A worm spreads automatically between vulnerable computers on a network.',
  'A trojan hides inside an installer that looks legitimate to the victim.',
  'Ransomware encrypts files and demands payment from the affected user.',
  'Spyware quietly collects information about the person using the device.'
].join('\n')

const DOC_B = [
  'Security Goals Sheet',
  'Confidentiality and Integrity',
  'Confidentiality keeps information secret from people who lack authorization.',
  'Integrity means records stay accurate and are not changed without permission.',
  'Availability ensures systems answer requests when legitimate users need them.',
  'Non-repudiation prevents a person from denying an action they approved.'
].join('\n')

function makeExam() {
  return {
    id: 'exam-1',
    title: 'IT Ethics Midterm',
    topics: [],
    docIds: ['doc-a', 'doc-b']
  }
}

const DOCS = [
  { id: 'doc-a', name: 'Ethics Principles Notes.txt', text: DOC_A },
  { id: 'doc-b', name: 'Security Goals Sheet.txt', text: DOC_B }
]

// One valid mcq row per numbered source line, derived from the sentence's own
// words so validation passes (correct answer never appears in the stem).
function rowsFromPrompt(prompt) {
  const lines = [...prompt.matchAll(/^\[(\d+)\] (.+)$/gm)]
  return lines.map(([, n, sentenceText]) => {
    const words = (sentenceText.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w, i, a) => a.indexOf(w) === i)
    const [w1, w2, w3, w4] = words
    if (!w1 || !w4) return null
    return {
      src: Number(n),
      kind: 'mcq',
      stem: `A company faces a situation involving ${w2}. Which concept from the study material applies?`,
      correct: w1,
      wrong: [w3, w4, `${w4} rule`].map(w => w === w1 ? w + ' law' : w),
      explanation: `Because ${w1} is the concept the material describes.`
    }
  }).filter(Boolean)
}

beforeEach(() => {
  vi.mocked(chatJSON).mockReset()
  vi.mocked(chatJSON).mockImplementation(async (prompt) => JSON.stringify(rowsFromPrompt(prompt)))
})

describe('authorExamQuiz', () => {
  it('authors scenario MCQs across every file and tags docId/topic', async () => {
    const gen = await authorExamQuiz(makeExam(), DOCS, { count: 6 }, () => {})
    expect(gen.error).toBeNull()
    expect(gen.questions.length).toBeGreaterThanOrEqual(3)
    const docIds = new Set(gen.questions.map(q => q.meta.docId))
    expect(docIds.has('doc-a')).toBe(true)
    expect(docIds.has('doc-b')).toBe(true)
    for (const q of gen.questions) {
      expect(q.type).toBe('mcq')
      expect(q.options).toHaveLength(4)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThan(4)
      expect(q.meta.topic).toBeTruthy()
      expect(q.meta.sentence).toBeTruthy()
      expect(q.explanation).toBeTruthy()
    }
    // stems must not leak the correct answer
    for (const q of gen.questions) {
      expect(q.stem.toLowerCase()).not.toContain(q.options[q.answerIndex].toLowerCase())
    }
    // the exam prompt (not the plain doc-quiz one) must be used
    const firstPrompt = vi.mocked(chatJSON).mock.calls[0][0]
    expect(firstPrompt).toContain('Topic of this batch')
    expect(firstPrompt).toContain('OPTION FAMILIES')
  })

  it('covers more than one topic when the material supports it', async () => {
    const gen = await authorExamQuiz(makeExam(), DOCS, { count: 8 }, () => {})
    const topics = new Set(gen.questions.map(q => q.meta.docId + '|' + q.meta.topic))
    expect(topics.size).toBeGreaterThanOrEqual(3)
  })

  it('respects the requested count when a unit needs multiple batches', async () => {
    // one big single-topic doc → pick spans 2+ batches; the unit must not
    // deliver its quota twice (the old multi-batch overshoot bug)
    const W1 = ['alpha', 'bravo', 'charlie', 'delta', 'eagle', 'foxtrot', 'grape', 'hotel', 'india', 'juliet',
      'krill', 'lilac', 'maple', 'november', 'oscar', 'peach', 'quebec', 'romeo', 'sierra', 'tango']
    const W2 = ['aurora', 'breeze', 'cobalt', 'dynamo', 'ember', 'frost', 'glide', 'harbor', 'ion', 'jade',
      'koala', 'lumen', 'manor', 'nectar', 'onyx', 'prism', 'quartz', 'ridge', 'summit', 'timber']
    const lines = ['Networking Basics']
    for (let i = 0; i < 20; i++) {
      lines.push(`A router ${W1[i]} packets between networks during every ${W2[i]} window.`)
    }
    const bigDoc = [{ id: 'doc-big', name: 'Networking Basics.txt', text: lines.join('\n') }]
    const gen = await authorExamQuiz(makeExam(), bigDoc, { count: 20 }, () => {})
    expect(gen.questions.length).toBe(20)
    const stems = new Set(gen.questions.map(q => q.stem.toLowerCase()))
    expect(stems.size).toBe(20)
  })

  it('falls back cleanly when the AI is unreachable', async () => {
    vi.mocked(chatJSON).mockRejectedValue(new Error('504'))
    const gen = await authorExamQuiz(makeExam(), DOCS, { count: 6 }, () => {})
    expect(gen.questions).toHaveLength(0)
    expect(gen.error).toBe('not_enough_content')
    // and the offline builder still produces the fallback quiz
    const offline = buildExamQuiz(makeExam(), DOCS, [], { count: 6 })
    expect(offline.questions.length).toBeGreaterThan(0)
    expect(offline.questions.every(q => q.meta?.docId)).toBe(true)
  })
})
