import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

// quiz-ai.js pulls in gemini.js (network) and storage.js (idb) — stub the
// network layer; idb is backed by fake-indexeddb like the other suites.
vi.mock('../src/app/core/engine/gemini.js', () => ({
  hasApiKey: () => true,
  chatJSON: vi.fn(),
  chatMultimodal: vi.fn()
}))

import { generateQuizAI, grounded, byokHelps, classifyAIError, polishQuestionSet, leaksOption } from '../src/app/core/engine/quiz-ai.js'
import { chatJSON } from '../src/app/core/engine/gemini.js'
import { authorQuizPrompt, AUTHOR_RULES } from '../src/app/core/engine/prompts.js'
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
    ],
    explanation: `The source explains why ${w1} and ${w2} matter in this process.`
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
    expect(gen.questions.every(q => q.explanation)).toBe(true)
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
    const request = vi.mocked(chatJSON).mock.calls[0][1]
    expect(request.shape).toBe('array')
    expect(request.schema.items.required).toContain('explanation')
  })

  it('falls back to built-in questions when authoring fails', async () => {
    vi.mocked(chatJSON).mockRejectedValueOnce(new Error('boom'))
    const gen = await generateQuizAI(makeDoc(), { ...CFG }, () => {})
    // heuristic base questions still come through; nothing AI-polished
    expect(gen.questions.length).toBeGreaterThan(0)
    expect(gen.aiPolished).toBeFalsy()
    expect(gen.aiNote).toBe('error')
  })

  it('polishes generated questions when aiAuthor is off', async () => {
    vi.mocked(chatJSON).mockImplementation(prompt => {
      const rows = []
      const item = /(\d+) \[mcq\] source sentence: "[^"]+" \| correct answer: "([^"]+)"/g
      for (const match of prompt.matchAll(item)) {
        rows.push({
          i: Number(match[1]),
          kind: 'mcq',
          stem: `Which option matches study concept ${Number(match[1]) + 1}?`,
          correct: match[2],
          wrong: ['Alpha process', 'Beta process', 'Gamma process']
        })
      }
      return Promise.resolve(JSON.stringify(rows))
    })

    const gen = await generateQuizAI(makeDoc(), { ...CFG, aiAuthor: false, mix: { mcq: true } }, () => {})

    expect(vi.mocked(chatJSON)).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ shape: 'array' }))
    expect(gen.questions).toHaveLength(CFG.count)
    expect(gen.aiPolished).toBe(true)
    expect(gen.aiNote).toBeNull()
    expect(gen.questions.every(q => q.options?.length === 4 && q.answerIndex >= 0 && q.answerIndex < 4)).toBe(true)
  })
})

describe('byokHelps (offline-vs-key choice)', () => {
  it('offers the choice for quota/key/busy failures', () => {
    for (const n of ['quota', 'invalid_key', 'server_busy', 'no_key', 'error']) {
      expect(byokHelps(n)).toBe(true)
    }
  })

  it('stays on silent offline fallback otherwise', () => {
    for (const n of ['timeout', 'offline', 'network_error', 'not_enough_content', 'author_empty', 'blocked_content', 'empty_response', null, '']) {
      expect(byokHelps(n)).toBe(false)
    }
  })
})

describe('classifyAIError (relay/provider failures)', () => {
  it('maps 502/504 and relay_http_* to server_busy, not generic error', () => {
    expect(classifyAIError(new Error('relay_http_502'))).toBe('server_busy')
    expect(classifyAIError(new Error('relay_http_504'))).toBe('server_busy')
    expect(classifyAIError(new Error('upstream_timeout'))).toBe('timeout')
    expect(classifyAIError(new Error('The operation was aborted due to timeout'))).toBe('timeout')
    expect(classifyAIError(new Error('gemini_http_500'))).toBe('server_busy')
  })

  it('keeps quota / invalid_key / timeout branches', () => {
    expect(classifyAIError(new Error('429 quota exceeded'))).toBe('quota')
    expect(classifyAIError(new Error('API key not valid. Please pass a valid API key.'))).toBe('invalid_key')
    expect(classifyAIError(new Error('timeout'))).toBe('timeout')
    expect(classifyAIError(new Error('network_error'))).toBe('offline')
  })
})

describe('polishQuestionSet (AI-written weak spots)', () => {
  const qs = () => [{
    type: 'mcq',
    stem: 'Which concept is described here: "Developer uses this concept daily."?',
    options: ['MVVM', 'MVC', 'MVP', 'Flux'],
    answerIndex: 0,
    meta: { sentence: 'Developer uses MVVM daily for building mobile apps worldwide.', term: 'MVVM', docId: 'd' }
  }]

  it('rewrites weak-spot stems exam-style', async () => {
    vi.mocked(chatJSON).mockResolvedValueOnce(JSON.stringify([
      { i: 0, kind: 'mcq', stem: 'Which pattern keeps UI state in a reactive ViewModel?', correct: 'MVVM', wrong: ['MVC', 'MVP', 'Flux'] }
    ]))
    const r = await polishQuestionSet(qs(), {})
    expect(r.polished).toBe(1)
    expect(r.aiNote).toBeNull()
    expect(r.questions[0].stem).toBe('Which pattern keeps UI state in a reactive ViewModel?')
    expect(r.questions[0].options).toHaveLength(4)
    expect(r.questions[0].options[r.questions[0].answerIndex]).toBe('MVVM')
  })

  it('restores acronym casing the model flattened', async () => {
    vi.mocked(chatJSON).mockResolvedValueOnce(JSON.stringify([
      { i: 0, kind: 'mcq', stem: 'Which pattern keeps UI state in a reactive ViewModel?', correct: 'Mvvm', wrong: ['MVC', 'MVP', 'Flux'] }
    ]))
    const r = await polishQuestionSet(qs(), {})
    expect(r.polished).toBe(1)
    expect(r.questions[0].options[r.questions[0].answerIndex]).toBe('MVVM')
    expect(r.questions[0].options).toContain('MVC')
    expect(r.questions[0].options).toContain('MVP')
  })

  it('falls back to the built-in questions when AI fails', async () => {
    vi.mocked(chatJSON).mockRejectedValueOnce(new Error('quota exploded'))
    const input = qs()
    const r = await polishQuestionSet(input, {})
    expect(r.polished).toBe(0)
    expect(r.questions).toEqual(input)
    expect(r.aiNote).toBe('quota')
    expect(byokHelps(r.aiNote)).toBe(true)
  })

  it('passes through items without source metadata', async () => {
    const r = await polishQuestionSet([{ type: 'mcq', stem: 'Old?', options: ['A', 'B', 'C', 'D'], answerIndex: 0 }], {})
    expect(r.polished).toBe(0)
    expect(r.aiNote).toBeNull()
    expect(vi.mocked(chatJSON).mock.calls.length).toBe(0)
  })
})

describe('AUTHOR_RULES (concept-first exam quality)', () => {
  it('demands concept coverage with a style mix, not one-question-per-sentence', () => {
    expect(AUTHOR_RULES).toContain('SCENARIO')
    expect(AUTHOR_RULES).toContain('DISTINCTION')
    expect(AUTHOR_RULES).toContain('20%')
    expect(AUTHOR_RULES).toContain('UPPERCASE')
    expect(AUTHOR_RULES).not.toContain('write ONE exam-style question')
    expect(AUTHOR_RULES).not.toContain('For EACH numbered source sentence, write ONE')
    const p = authorQuizPrompt([{ i: 0, text: 'Alpha beta gamma delta.' }])
    expect(p).toContain('"src"')
  })
})

describe('leaksOption (answer-in-stem validation)', () => {
  it('flags options named in the stem', () => {
    expect(leaksOption('What does CICC stand for?', ['CICC', 'NBI', 'PNP', 'DICT'])).toBe(true)
    expect(leaksOption('Which agency handles cybercrime forensics?', ['CICC', 'NBI', 'PNP', 'DICT'])).toBe(false)
  })

  it('ignores long chains unless the whole chain appears', () => {
    const chain = 'Report → Assess → Collect → Analyze'
    expect(leaksOption('Which sequence matches the report stage?', [chain, 'Collect → Report → Analyze → Assess'])).toBe(false)
    expect(leaksOption(`First do ${chain} in order?`, [chain, 'Other'])).toBe(true)
  })
})

describe('quiz export for new types', () => {
  it('renders except and multi questions with their answers', () => {
    const md = buildQuizMarkdown('Test', [
      { type: 'except', stem: 'All of the following are true EXCEPT:', options: ['A true one', 'Another true one', 'A third true one', 'The false one'], answerIndex: 3 },
      { type: 'multi', stem: 'Select TWO correct statements.', options: ['Right one', 'Wrong one', 'Right two', 'Wrong two', 'Wrong three'], answerIndices: [0, 2] }
    ])
    expect(md).toContain('### Multiple Choice — Except')
    expect(md).toContain('### Multiple Choice — Select Two')
    expect(md).toContain('**Directions:**')
    expect(md).toContain('D. The false one')
    expect(md).toContain('A · C')
  })

  it('formats mcq quizzes in the classic school layout', () => {
    const md = buildQuizMarkdown('Test', [
      { type: 'mcq', stem: 'What is the primary purpose of an operating system?', options: ['To create presentations', 'To manage hardware and software resources', 'To browse the internet', 'To edit images'], answerIndex: 1 },
      { type: 'mcq', stem: 'Which of the following is a programming language?', options: ['HTML', 'CSS', 'Python', 'HTTP'], answerIndex: 2 },
      { type: 'tf', statement: 'The CPU is the brain of the computer.', answer: true }
    ])
    expect(md).toContain('### Multiple Choice')
    expect(md).toContain('**Directions:** Read each question carefully. Choose the letter of the best answer.')
    expect(md).toContain('**1. What is the primary purpose of an operating system?**')
    expect(md).toContain('B. To manage hardware and software resources')
    expect(md).toContain('**2. Which of the following is a programming language?**')
    expect(md).toContain('C. Python')
    expect(md).toContain('**Answer:** B')
    expect(md).toContain('### True or False')
    expect(md).toContain('**3. The CPU is the brain of the computer.**')
  })
})
