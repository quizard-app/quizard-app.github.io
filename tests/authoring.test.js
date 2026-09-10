import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

// quiz-ai.js pulls in gemini.js (network) and storage.js (idb) — stub the
// network layer; idb is backed by fake-indexeddb like the other suites.
vi.mock('../src/app/core/engine/gemini.js', () => ({
  hasApiKey: () => true,
  chatJSON: vi.fn(),
  chatMultimodal: vi.fn()
}))

import { generateQuizAI, grounded } from '../src/app/core/engine/quiz-ai.js'
import { chatJSON } from '../src/app/core/engine/gemini.js'
import { authorQuizPrompt } from '../src/app/core/engine/prompts.js'
import { sentences, termFreq, scoreSentences, stripHeadings } from '../src/app/core/engine/textproc.js'
import { buildQuizMarkdown } from '../src/app/core/engine/export.js'

const DOC = [
  'Photosynthesis Practice',
  'Unit 2 Review',
  '',
  'Photosynthesis converts light energy into chemical energy inside chloroplasts daily.',
  'Chlorophyll absorbs sunlight most strongly in the blue and red wavelengths always.',
  'The Calvin cycle produces glucose using ATP and NADPH generated during daylight.',
  'Stomata are tiny pores that regulate gas exchange in plant leaves constantly.',
  'Respiration releases energy from glucose molecules within all living cells nightly.',
  'Mitochondria generate ATP through cellular respiration during the entire day today.',
  'Enzymes accelerate chemical reactions without being consumed by cells ever.',
  'To germinate, a seed absorbs water, activates enzymes, and grows a root, then pushes a shoot above the soil.'
].join('\n')

function makeDoc() { return { id: 'doc-author-1', name: 'Photosynthesis Practice', text: DOC } }

// Mirror authorFullQuiz's material selection so crafted rows cite the exact
// source sentences the generator will hand the model.
function materialGroup() {
  const ranked = scoreSentences(sentences(stripHeadings(DOC)), termFreq(stripHeadings(DOC)))
  return ranked.slice(0, 12).slice(0, 6).map((s, k) => ({ i: k, text: s.text }))
}

function contentWords(s) {
  return (s.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w, i, a) => a.indexOf(w) === i)
}

// Build a valid mcq row grounded in group[k]'s sentence.
function validRow(group, k) {
  const words = contentWords(group[k].text)
  const w1 = words[0] || 'energy'
  const w2 = words[1] || 'cells'
  return {
    src: k,
    kind: 'mcq',
    stem: `Explain why ${w1} matters for ${w2} in this process.`,
    correct: `Because ${w1} and ${w2} drive the process described here.`,
    wrong: [
      'It stores water for the dry season ahead.',
      'It attracts insects that spread pollen widely.',
      'It cools the roots during hot afternoons.'
    ]
  }
}

const CFG = {
  count: 4,
  mix: { mcq: true, tf: true, fib: true, id: true },
  difficulty: 'medium',
  shuffle: false,
  timerSec: 0,
  fresh: true,
  topics: [],
  fixedSeed: 5,
  ai: true,
  aiAuthor: true,
  deepVisual: false
}

beforeEach(() => {
  vi.mocked(chatJSON).mockReset()
})

describe('grounded', () => {
  it('accepts question text sharing content words with its source', () => {
    expect(grounded(
      'Why is photosynthesis important for plants that need energy?',
      'Photosynthesis converts light energy into chemical energy inside chloroplasts daily.'
    )).toBe(true)
  })

  it('rejects hallucinated text with no overlap', () => {
    expect(grounded(
      'Why do unicorns prefer rainbow pastures at midnight?',
      'Photosynthesis converts light energy into chemical energy inside chloroplasts daily.'
    )).toBe(false)
  })
})

describe('authorQuizPrompt', () => {
  it('numbers each source sentence for src citation', () => {
    const p = authorQuizPrompt([{ i: 0, text: 'Alpha beta gamma delta.' }, { i: 1, text: 'One two three four five.' }])
    expect(p).toContain('[0] Alpha beta gamma delta.')
    expect(p).toContain('[1] One two three four five.')
    expect(p).toContain('"src"')
  })
})

describe('full AI authoring', () => {
  it('authors grounded questions and rejects junk rows', async () => {
    const group = materialGroup()
    const rows = [0, 1, 2, 3].map(k => validRow(group, k))
    rows.push(
      // out-of-range src — must be skipped
      { src: 40, kind: 'mcq', stem: 'What is the capital of France?', correct: 'Paris is the capital of France.', wrong: ['London is big.', 'Rome is old.', 'Madrid is warm.'] },
      // ungrounded hallucination — must be skipped
      {
        src: 1, kind: 'mcq',
        stem: 'Why do unicorns prefer rainbow pastures at midnight?',
        correct: 'Unicorns graze where moonlight drinks the silver dew.',
        wrong: ['They nap under toadstools daily.', 'They race the comets nightly.', 'They hide in teacups often.']
      },
      // mentions the document title — banned, must be skipped
      {
        src: 2, kind: 'mcq',
        stem: 'In Photosynthesis Practice, what is the capital of France?',
        correct: 'Paris is the capital of France.',
        wrong: ['London is big.', 'Rome is old.', 'Madrid is warm.']
      }
    )
    vi.mocked(chatJSON).mockResolvedValueOnce(JSON.stringify(rows))

    const gen = await generateQuizAI(makeDoc(), { ...CFG }, () => {})
    expect(gen.questions).toHaveLength(4)
    expect(gen.aiPolished).toBe(true)
    for (const [n, q] of gen.questions.entries()) {
      expect(q.type).toBe('mcq')
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThan(4)
      expect(q.meta?.sentence).toBe(group[n].text)
      expect(q.meta?.docId).toBe('doc-author-1')
    }
    // one model call for the whole quiz (single batch of 4)
    expect(vi.mocked(chatJSON).mock.calls.length).toBe(1)
  })

  it('falls back to built-in questions when authoring fails', async () => {
    vi.mocked(chatJSON).mockRejectedValueOnce(new Error('boom'))
    const gen = await generateQuizAI(makeDoc(), { ...CFG }, () => {})
    // heuristic base questions still come through; nothing AI-polished
    expect(gen.questions.length).toBeGreaterThan(0)
    expect(gen.aiPolished).toBeFalsy()
    expect(gen.aiNote).toBe('error')
  })

  it('does not author when aiAuthor is off', async () => {
    const gen = await generateQuizAI(makeDoc(), { ...CFG, aiAuthor: false }, () => {})
    // polish path: chatJSON mock returns undefined → no replacements
    expect(gen.questions.length).toBeGreaterThan(0)
    expect(gen.questions.every(q => !q.meta?.authored)).toBe(true)
  })
})

describe('quiz export for new types', () => {
  it('renders except and multi questions with their answers', () => {
    const md = buildQuizMarkdown('Test', [
      { type: 'except', stem: 'All of the following are true EXCEPT:', options: ['A true one', 'Another true one', 'A third true one', 'The false one'], answerIndex: 3 },
      { type: 'multi', stem: 'Select TWO correct statements.', options: ['Right one', 'Wrong one', 'Right two', 'Wrong two', 'Wrong three'], answerIndices: [0, 2] }
    ])
    expect(md).toContain('[EXCEPT]')
    expect(md).toContain('[SELECT TWO]')
    expect(md).toContain('The false one')
    expect(md).toContain('Right one · Right two')
  })
})
