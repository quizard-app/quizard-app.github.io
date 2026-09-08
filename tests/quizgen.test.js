import { describe, it, expect } from 'vitest'
import { generateQuiz, swapWithDistractor, tierForTerm } from '../src/lib/quizgen.js'
import { isTitleLike, mulberry32 } from '../src/lib/textproc.js'
import { buildMcqStem, buildShortPrompt, pickDistractors, termClass, formatOption, buildCooccurrence } from '../src/lib/questionForms.js'

const DOC = [
  'Biology Study Guide',
  'Chapter 3: Photosynthesis',
  '',
  'Photosynthesis converts light energy into chemical energy inside chloroplasts.',
  'Chlorophyll absorbs sunlight most strongly in the blue and red wavelengths.',
  'The Calvin cycle produces glucose using ATP and NADPH generated earlier.',
  'Stomata are tiny pores that regulate gas exchange in plant leaves.',
  'Respiration releases energy from glucose molecules within all living cells.',
  'Mitochondria generate ATP through cellular respiration during the entire day.',
  'KEY TERMS',
  'Enzymes accelerate chemical reactions without being consumed by them at all.'
].join('\n')

const CONFIG = {
  count: 8,
  mix: { mcq: true, tf: true, fib: true, id: true },
  difficulty: 'medium',
  shuffle: false,
  timerSec: 0,
  fresh: true,
  topics: [],
  fixedSeed: 12345
}

function makeDoc() {
  return { id: 'doc-test-1', text: DOC }
}

describe('generateQuiz', () => {
  it('is deterministic for a fixed seed', () => {
    const a = generateQuiz(makeDoc(), { ...CONFIG })
    const b = generateQuiz(makeDoc(), { ...CONFIG })
    expect(a.questions).toEqual(b.questions)
    expect(a.seed).toBe(b.seed)
  })

  it('produces no more than requested count and flags partial honestly', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG })
    expect(gen.questions.length).toBeGreaterThan(0)
    expect(gen.questions.length).toBeLessThanOrEqual(CONFIG.count)
    if (gen.questions.length < CONFIG.count) {
      expect(gen.error).toBe('partial')
    } else {
      expect(gen.error).toBeNull()
    }
  })

  it('never leaks heading lines into any question content', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG })
    const headings = DOC.split(/\n+/).map(l => l.trim()).filter(l => l && isTitleLike(l))
    expect(headings.length).toBeGreaterThan(0)
    for (const q of gen.questions) {
      const surfaces = [q.stem, q.statement, q.clue, ...(q.options || []), ...(q.choices || [])]
        .filter(Boolean)
        .join(' | ')
      for (const h of headings) {
        expect(surfaces.toLowerCase()).not.toContain(h.toLowerCase())
      }
    }
  })

  it('respects enabled question types only', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG, mix: { mcq: true, tf: false, fib: false, id: false } })
    expect(gen.questions.length).toBeGreaterThan(0)
    for (const q of gen.questions) expect(q.type).toBe('mcq')
  })

  it('returns not_enough_content for empty documents', () => {
    const gen = generateQuiz({ id: 'x', text: '' }, CONFIG)
    expect(gen.error).toBe('not_enough_content')
    expect(gen.questions).toHaveLength(0)
  })

  it('mcq answers point at the correct option', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG })
    for (const q of gen.questions.filter(q => q.type === 'mcq')) {
      expect(q.options[q.answerIndex]).toBeTruthy()
      // answer term must not appear in the stem (any style)
      const answer = q.options[q.answerIndex]
      expect(q.stem.toLowerCase()).not.toContain(answer.toLowerCase())
      // stem is either a teacher-style question or a cloze with BLANK
      const isQuestion = q.stem.endsWith('?')
      const isCloze = /\u0000BLANK\u0000/.test(q.stem) || q.stem.includes('Complete the statement')
      expect(isQuestion || isCloze).toBe(true)
      // all options are unique (case-insensitive)
      const lower = q.options.map(o => o.toLowerCase())
      expect(new Set(lower).size).toBe(lower.length)
    }
  })

  it('tf statements carry a boolean answer', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG })
    for (const q of gen.questions.filter(q => q.type === 'tf')) {
      expect(typeof q.answer).toBe('boolean')
      expect(q.statement.split(/\s+/).length).toBeGreaterThan(4)
    }
  })

  it('short answer prompts are not circular', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG, mix: { short: true }, count: 6 })
    for (const q of gen.questions.filter(q => q.type === 'short')) {
      // prompt should not be 'What is "X"?' with answer X — that's circular
      const circularRe = new RegExp(`What is\\s+["\u201c]\\s*${q.answer}\\s*["\u201d]\\?`, 'i')
      expect(circularRe.test(q.prompt)).toBe(false)
      // prompt should contain the answer term (either as blank or in a definition)
      // but NOT as the direct object of "What is"
    }
  })
})

describe('questionForms', () => {
  it('buildMcqStem produces question or cloze', () => {
    const { stem, style } = buildMcqStem(
      'Photosynthesis converts light energy into chemical energy inside chloroplasts.',
      'Photosynthesis'
    )
    expect(style).toMatch(/subject-question|definition|cloze/)
    if (style === 'cloze') {
      expect(stem).toContain('Complete the statement')
      expect(stem).toMatch(/\u0000BLANK\u0000/)
    } else {
      expect(stem.endsWith('?')).toBe(true)
      expect(stem.toLowerCase()).not.toContain('photosynthesis')
    }
  })

  it('buildShortPrompt is not circular', () => {
    const prompt = buildShortPrompt(
      'Mitochondria generate ATP through cellular respiration during the entire day.',
      'Mitochondria'
    )
    const circularRe = /What is\s+["\u201c]Mitochondria["\u201d]\?/i
    expect(circularRe.test(prompt)).toBe(false)
  })

  it('pickDistractors excludes answer and substrings', () => {
    const rng = () => 0.5
    const terms = [
      { term: 'chemical energy', freq: 5 },
      { term: 'chemical', freq: 3 },
      { term: 'light energy', freq: 4 },
      { term: 'ATP', freq: 6 },
      { term: 'chloroplasts', freq: 2 },
      { term: 'glucose', freq: 4 }
    ]
    const distractors = pickDistractors(
      { term: 'chemical energy', proper: false, phrase: false },
      terms, rng, 3
    )
    // answer itself excluded
    expect(distractors).not.toContain('chemical energy')
    // substring "chemical" excluded (contained in "chemical energy")
    expect(distractors).not.toContain('chemical')
    // at least some distractors returned
    expect(distractors.length).toBeGreaterThan(0)
  })

  it('formatOption capitalizes first letter', () => {
    expect(formatOption('atp')).toBe('Atp')
    expect(formatOption('ATP')).toBe('ATP')
    expect(formatOption('light energy.')).toBe('Light energy')
  })

  it('termClass categorizes terms', () => {
    expect(termClass({ term: 'photosynthesis' })).toBe('process')
    expect(termClass({ term: 'ATP synthase' })).toBe('phrase')
    expect(termClass({ term: 'ATP', proper: true })).toBe('proper')
    expect(termClass({ term: 'chloroplasts' })).toBe('plural')
    expect(termClass({ term: 'mitochondria' })).toBe('plain')
  })

  it('buildCooccurrence maps co-occurring terms', () => {
    const sents = ['ATP and NADPH are produced.', 'NADPH reduces carbon compounds.', 'ATP powers cellular work.']
    const terms = [{ term: 'ATP' }, { term: 'NADPH' }]
    const co = buildCooccurrence(sents, terms)
    expect(co.get('ATP').get('NADPH')).toBe(1)
    expect(co.get('NADPH').get('ATP')).toBe(1)
  })

  it('pickDistractors rejects near-duplicate distractors (same stem)', () => {
    const rng = () => 0.5
    const terms = [
      { term: 'photosynthesis', freq: 4 },
      { term: 'photosynthetic', freq: 4 },
      { term: 'chlorophyll', freq: 5 },
      { term: 'mitochondria', freq: 5 },
      { term: 'glucose', freq: 5 }
    ]
    const distractors = pickDistractors({ term: 'respiration', freq: 6 }, terms, rng, 4)
    expect(distractors.length).toBe(4)
    // "photosynthesis" and "photosynthetic" share a stem — never both options
    expect(distractors.includes('photosynthesis') && distractors.includes('photosynthetic')).toBe(false)
  })
})

describe('tf false-statement swaps', () => {
  const pool = [
    { term: 'basic ethical theories', phrase: true, freq: 3 },
    { term: 'john stuart mill', proper: true, freq: 3 },
    { term: 'immanuel kant', proper: true, freq: 3 },
    { term: 'aristotle', proper: true, freq: 3 }
  ]
  const sentence = 'Developed by Jeremy Bentham, this view differs from John Stuart Mill, Immanuel Kant and Aristotle.'

  it('lowercases a common-phrase swap mid-sentence (the "Basic ethical theories" bug)', () => {
    const out = swapWithDistractor(
      sentence,
      { term: 'jeremy bentham', proper: true },
      pool,
      mulberry32(42)
    )
    expect(out).toBeTruthy()
    // the only distractor not already in the sentence is the common phrase
    expect(out).toContain('basic ethical theories')
    expect(out).not.toContain('Basic ethical theories')
  })

  it('capitalizes the swap when it opens the sentence', () => {
    const out = swapWithDistractor(
      'Jeremy Bentham developed this view over many years of careful study.',
      { term: 'jeremy bentham', proper: true },
      pool,
      mulberry32(42)
    )
    expect(out).toBeTruthy()
    expect(out[0]).toBe(out[0].toUpperCase())
  })

  it('refuses possessive slots ("Bentham\'s" -> "theories\'s" is broken)', () => {
    const out = swapWithDistractor(
      "Jeremy Bentham's view on happiness shaped later thinkers considerably.",
      { term: 'jeremy bentham', proper: true },
      pool,
      mulberry32(7)
    )
    expect(out).toBeNull()
  })
})

describe('exam-style formats', () => {
  it('except questions have 4 options with one false answer', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG, count: 4, mix: { except: true }, fixedSeed: 21 })
    const ex = gen.questions.filter(q => q.type === 'except')
    expect(ex.length).toBeGreaterThan(0)
    for (const q of ex) {
      expect(q.stem).toMatch(/EXCEPT/)
      expect(q.options).toHaveLength(4)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThan(4)
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it('multi questions have 5 options with exactly two answers', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG, count: 4, mix: { multi: true }, fixedSeed: 22 })
    const mu = gen.questions.filter(q => q.type === 'multi')
    expect(mu.length).toBeGreaterThan(0)
    for (const q of mu) {
      expect(q.options).toHaveLength(5)
      expect(q.answerIndices).toHaveLength(2)
      const sorted = [...q.answerIndices].sort((a, b) => a - b)
      expect(q.answerIndices).toEqual(sorted)
      for (const i of q.answerIndices) {
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(5)
      }
    }
  })
})

describe('adaptive difficulty', () => {
  it('tierForTerm ranks common terms easy and rare terms hard', () => {
    const terms = [
      { term: 'energy', freq: 20 },
      { term: 'glucose', freq: 8 },
      { term: 'chlorophyll', freq: 3 },
      { term: 'nadph', freq: 1 }
    ]
    expect(tierForTerm('energy', terms)).toBe('easy')
    expect(tierForTerm('nadph', terms)).toBe('hard')
    expect(['easy', 'medium', 'hard']).toContain(tierForTerm('glucose', terms))
    expect(tierForTerm('missing-term', terms)).toBeNull()
  })

  it('adaptive generation tags term-grounded questions with a valid tier', () => {
    const gen = generateQuiz(makeDoc(), { ...CONFIG, count: 8, difficulty: 'adaptive', fixedSeed: 9 })
    expect(gen.questions.length).toBeGreaterThan(0)
    const tagged = gen.questions.filter(q => q.meta?.tier)
    expect(tagged.length).toBeGreaterThan(0)
    for (const q of tagged) {
      expect(['easy', 'medium', 'hard']).toContain(q.meta.tier)
    }
    // the pool should span more than one tier for adaptivity to matter
    expect(new Set(tagged.map(q => q.meta.tier)).size).toBeGreaterThan(1)
  })
})
