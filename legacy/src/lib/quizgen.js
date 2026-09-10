/**
 * @typedef {Object} DocMeta - Document metadata (from storage)
 * @property {string} id
 * @property {string} name
 * @property {string} text
 * @property {string} [folder]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} QuizConfig
 * @property {number} count - Number of questions to generate
 * @property {{ mcq?: boolean, tf?: boolean, fib?: boolean, id?: boolean, matching?: boolean, ordering?: boolean, short?: boolean, except?: boolean, multi?: boolean }} mix - Enabled question types
 * @property {'easy' | 'medium' | 'hard' | 'adaptive'} difficulty
 * @property {boolean} shuffle - Whether to shuffle final questions
 * @property {number} [timerSec] - Timer in seconds (0 = off)
 * @property {boolean} [fresh] - Prefer unused sentences
 * @property {string[]} [topics] - Topic filter
 * @property {number} [fixedSeed] - Deterministic seed
 * @property {boolean} [focusWeak] - Bias toward weak terms
 * @property {Array<{term: string}>} [weakTerms] - Weak terms for biasing
 * @property {boolean} [aiAuthor] - AI authors the whole quiz instead of polishing
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {'mcq' | 'tf' | 'fib' | 'id' | 'matching' | 'ordering' | 'short' | 'except' | 'multi'} type
 * @property {string} [stem] - Question stem (mcq, fib)
 * @property {string} [statement] - Statement for TF questions
 * @property {string} [clue] - Clue for ID questions
 * @property {string} [prompt] - Prompt for short/matching/ordering
 * @property {string[]} [options] - MCQ options
 * @property {string[]} [choices] - FIB choices
 * @property {number} [answerIndex] - Correct option index (mcq, fib)
 * @property {boolean} [answer] - TF answer
 * @property {string} [answer] - ID/short answer
 * @property {{ sentence: string, term: string, docId?: string }} [meta]
 */

/**
 * @typedef {Object} QuizResult
 * @property {QuizQuestion[]} questions
 * @property {number} seed
 * @property {'partial' | 'not_enough_content' | 'no_types' | null} error
 */

import { sentences, termFreq, keyTerms, scoreSentences, stripHeadings, cleanSentence, mulberry32, shuffleArr } from './textproc.js'
import { detectTopics } from './topics.js'
import { pickDistractors as pickImprovedDistractors, buildCooccurrence, buildMcqStem, buildShortPrompt, formatOption } from './questionForms.js'

/**
 * Build MCQ/ID questions from previously banked mistakes.
 * @param {Array<{docId: string, sentence: string, term: string, type: string}>} mistakes
 * @param {Map<string, Array<{term: string, freq: number}>>} docTerms - Per-doc term map
 * @returns {QuizQuestion[]}
 */
export function buildMistakeQuestions(mistakes, docTerms) {
  const rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0)
  // Banked sentences may predate inline-furniture cleaning — re-clean them.
  mistakes = mistakes.map(m => ({ ...m, sentence: cleanSentence(m.sentence) }))
  return mistakes.map(m => {
    const pool = (docTerms.get(m.docId) || []).filter(t => t.term !== m.term.toLowerCase())
    if (pool.length >= 3) {
      const distractors = pickImprovedDistractors({ term: m.term, proper: false, phrase: false }, pool, rng, 3)
      if (distractors.length === 3) {
        const options = shuffleArr([m.term, ...distractors], rng).map(formatOption)
        return {
          type: 'mcq',
          stem: blankTerm(m.sentence, m.term),
          options,
          answerIndex: options.findIndex(o => o.toLowerCase() === m.term.toLowerCase()),
          meta: { sentence: m.sentence, term: m.term, docId: m.docId }
        }
      }
    }
    const re = new RegExp(m.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return {
      type: 'id',
      clue: m.sentence.replace(re, '\u2026\u2026\u2026'),
      answer: m.term,
      meta: { sentence: m.sentence, term: m.term, docId: m.docId }
    }
  }).filter(Boolean)
}

export const TYPE_META = {
  mcq: { name: 'Multiple Choice', short: 'MCQ' },
  tf: { name: 'True or False', short: 'T/F' },
  fib: { name: 'Fill the Blank', short: 'Blank' },
  id: { name: 'Identification', short: 'Identify' },
  matching: { name: 'Matching', short: 'Match' },
  ordering: { name: 'Ordering', short: 'Order' },
  short: { name: 'Short Answer', short: 'Short' },
  except: { name: 'Except (find the false one)', short: 'EXCEPT' },
  multi: { name: 'Select Two', short: 'Select 2' }
}

const DIFFICULTY = {
  easy: [0, 0.35],
  medium: [0.3, 0.75],
  hard: [0.65, 1],
  // Adaptive serves from the full band at generation time; the quiz screen
  // reorders questions by tier at runtime (hard on streaks, easy after misses).
  adaptive: [0, 1]
}

// Difficulty tier of a term by its frequency rank: common terms are easy,
// rare/specific ones are hard. Used to tag questions for adaptive serving.
export function tierForTerm(termStr, terms) {
  if (!termStr || !terms.length) return null
  const sorted = terms.slice().sort((a, b) => (b.freq || 0) - (a.freq || 0))
  const idx = sorted.findIndex(t => t.term === String(termStr).toLowerCase())
  if (idx === -1) return null
  const pct = sorted.length > 1 ? idx / (sorted.length - 1) : 0
  return pct < 0.35 ? 'easy' : pct < 0.75 ? 'medium' : 'hard'
}

function findTermInSentence(sentence, terms) {
  const lower = ' ' + sentence.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') + ' '
  for (const t of terms) {
    const needle = t.phrase ? t.term : ` ${t.term} `
    if (lower.includes(t.phrase ? t.term : needle)) {
      const re = new RegExp(t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      if (re.test(sentence)) return t
    }
  }
  return null
}

function blankTerm(sentence, term) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return sentence.replace(re, '\u0000BLANK\u0000')
}

function tweakNumbers(sentence, rng) {
  let changed = false
  const result = sentence.replace(/\b(\d{1,4})(\.\d+)?\b/g, (full, intPart, decPart) => {
    if (changed) return full
    if (['1', '2', '3'].includes(intPart) && rng() < 0.5) return full
    const n = parseInt(intPart, 10)
    const delta = n > 20 ? Math.max(2, Math.round(n * (0.15 + rng() * 0.35))) : 1 + Math.floor(rng() * 3)
    const nn = Math.max(1, n + (rng() < 0.5 ? delta : -delta))
    changed = true
    return String(nn) + (decPart || '')
  })
  return changed ? result : null
}

function allocateCounts(enabledTypes, total) {
  const per = Math.floor(total / enabledTypes.length)
  const counts = {}
  enabledTypes.forEach(t => { counts[t] = per })
  let rem = total - per * enabledTypes.length
  for (let i = 0; rem > 0; i = (i + 1) % enabledTypes.length) {
    counts[enabledTypes[i]]++
    rem--
    if (rem === 0) break
  }
  return counts
}

/**
 * Estimate how many questions can be generated from a document.
 * @param {DocMeta} doc
 * @param {QuizConfig} config
 * @returns {number}
 */
export function estimateAvailable(doc, config) {
  const probe = { ...config, count: 999 }
  const gen = generateQuiz(doc, probe)
  return gen.questions.length
}

/**
 * Generate a quiz from a document's text.
 * @param {DocMeta} doc
 * @param {QuizConfig} config
 * @returns {QuizResult}
 */
export function generateQuiz(doc, config) {
  const seed = config.fixedSeed != null ? config.fixedSeed : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
  const rng = mulberry32(seed ^ require_hash(doc.id))

  const text = stripHeadings(doc.text)
  const sents = sentences(text)
  const tf = termFreq(text)
  const ranked = scoreSentences(sents, tf)
  const terms = keyTerms(text)

  if (!terms.length || ranked.length < 3) {
    return { questions: [], seed, error: 'not_enough_content' }
  }

  const [loPct, hiPct] = DIFFICULTY[config.difficulty] || DIFFICULTY.medium
  const tierStart = Math.floor(terms.length * loPct)
  const tierEnd = Math.max(tierStart + Math.ceil(terms.length * 0.25), Math.floor(terms.length * hiPct))
  const tierTerms = terms.slice(tierStart, tierEnd)

  const poolSize = Math.min(ranked.length, Math.max(config.count * 3, 30))
  let sentPool = ranked.slice(0, poolSize)

  const cooccur = buildCooccurrence(ranked.map(s => s.text), terms)

  if (Array.isArray(config.topics) && config.topics.length) {
    const { membership } = detectTopics(text)
    const wanted = new Set(config.topics.map(t => t.toLowerCase()))
    const scoped = ranked.filter(s => {
      const t = membership.get(s.text)
      return t && wanted.has(t.toLowerCase())
    })
    if (scoped.length >= 3) {
      sentPool = scoped
      const scopedTf = termFreq(scoped.map(s => s.text).join(' '))
      const scopedTerms = keyTerms(scoped.map(s => s.text).join(' '))
      terms.length = 0
      terms.push(...scopedTerms)
      tf.clear()
      for (const [k, v] of scopedTf) tf.set(k, v)
    }
  } else {
    // Topic coverage: interleave the pool round-robin across detected topics
    // so every section of the document gets quizzed, not just whichever terms
    // happen to be most frequent. Buckets keep ranked order internally.
    try {
      const { membership } = detectTopics(text)
      if (membership.size) {
        const buckets = new Map()
        const loose = []
        for (const s of sentPool) {
          const t = membership.get(s.text)
          if (t) {
            if (!buckets.has(t)) buckets.set(t, [])
            buckets.get(t).push(s)
          } else loose.push(s)
        }
        if (buckets.size >= 2) {
          const order = [...buckets.keys()].sort((a, b) =>
            (buckets.get(b)[0]?.score ?? 0) - (buckets.get(a)[0]?.score ?? 0))
          const mixed = []
          for (let i = 0; ; i++) {
            let added = false
            for (const k of order) {
              const b = buckets.get(k)
              if (i < b.length) { mixed.push(b[i]); added = true }
            }
            if (!added) break
          }
          sentPool = mixed.concat(loose)
        }
      }
    } catch { /* topic interleave is best-effort */ }
  }

  // Weak-focus partition runs LAST (stable): sentences containing the
  // learner's weak terms float to the front of the pool while keeping the
  // topic-interleaved order inside each group. Running it before the
  // interleave would let the interleave destroy the biasing.
  if (config.focusWeak && Array.isArray(config.weakTerms) && config.weakTerms.length) {
    const weakSet = new Set(config.weakTerms.map(w => String(w.term || w).toLowerCase()))
    sentPool = sentPool.slice().sort((a, b) => {
      const aw = weakSet.has(termIn(weakSet, a.text)) ? 0 : 1
      const bw = weakSet.has(termIn(weakSet, b.text)) ? 0 : 1
      return aw - bw
    })
  }

  const enabled = Object.entries(config.mix || {}).filter(([, on]) => on).map(([t]) => t)
  if (!enabled.length) return { questions: [], seed, error: 'no_types' }
  const counts = allocateCounts(enabled, config.count)

  const questions = []
  const usedSentences = new Set()
  const usedTerms = new Set()

  function takeCandidate() {
    for (let i = 0; i < sentPool.length; i++) {
      const s = sentPool[i]
      if (usedSentences.has(s.text)) continue
      const term = findTermInSentence(s.text, terms.filter(t => !usedTerms.has(t.term)).concat(tierTerms))
      if (!term) continue
      usedSentences.add(s.text)
      return { ...s, term }
    }
    return null
  }

  const queue = []
  for (const t of enabled) {
    for (let i = 0; i < counts[t]; i++) queue.push(t)
  }
  const typeOrder = shuffleArr(queue, rng)

  for (const type of typeOrder) {
    if (questions.length >= config.count) break
    if (type === 'matching') {
      const q = buildMatchingSet(rng, terms, tierTerms, sentPool, usedSentences, usedTerms, config)
      if (q) questions.push(q)
      continue
    }
    if (type === 'ordering') {
      const q = buildOrderingSet(rng, sentPool, usedSentences, terms)
      if (q) questions.push(q)
      continue
    }
    if (type === 'except') {
      const q = buildExceptQuestion(rng, sentPool, usedSentences, usedTerms, terms, tierTerms)
      if (q) questions.push(q)
      continue
    }
    if (type === 'multi') {
      const q = buildMultiQuestion(rng, sentPool, usedSentences, usedTerms, terms, tierTerms)
      if (q) questions.push(q)
      continue
    }
    const cand = takeCandidate()
    if (!cand) break
    const q = buildQuestion(type, cand, terms, tierTerms, rng, { cooccur })
    if (!q) continue
    usedTerms.add(cand.term.term)
    q.meta = { sentence: cand.text, term: cand.term.term }
    questions.push(q)
  }

  let final = questions
  if (config.shuffle) final = shuffleArr(final, rng)

  // Tag every term-grounded question with its difficulty tier so the quiz
  // screen can serve adaptively (and so adaptive works on AI-polished
  // questions too, which keep the heuristic term in meta).
  for (const q of final) {
    if (q.meta?.term && !q.meta.tier) {
      const tier = tierForTerm(q.meta.term, terms)
      if (tier) q.meta.tier = tier
    }
  }

  return {
    questions: final,
    seed,
    error: final.length < config.count ? 'partial' : null
  }
}

function buildQuestion(type, cand, allTerms, tierTerms, rng, opts = {}) {
  const term = cand.term
  const cooccur = opts.cooccur
  const combinedTerms = allTerms.concat(tierTerms.filter(t => !allTerms.includes(t)))

  switch (type) {
    case 'mcq': {
      const distractors = pickImprovedDistractors(term, combinedTerms, rng, 3, {
        avoidSentence: cand.text,
        cooccur
      })
      if (distractors.length < 3) return null
      const options = shuffleArr([term.term, ...distractors], rng).map(formatOption)
      const answerIdx = options.findIndex(o => o.toLowerCase() === term.term.toLowerCase())
      if (answerIdx === -1) return null
      const { stem } = buildMcqStem(cand.text, term.term)
      return { type, stem, options, answerIndex: answerIdx }
    }
    case 'tf': {
      const makeFalse = rng() < 0.55
      if (makeFalse) {
        const swapped = swapWithDistractor(cand.text, term, combinedTerms, rng)
        if (swapped) return { type, statement: swapped, answer: false }
        const tweaked = tweakNumbers(cand.text, rng)
        if (tweaked) return { type, statement: tweaked, answer: false }
      }
      return { type, statement: cand.text, answer: true }
    }
    case 'fib': {
      const distractors = pickImprovedDistractors(term, combinedTerms, rng, 3, {
        avoidSentence: cand.text,
        cooccur
      })
      if (distractors.length < 3) return null
      const choices = shuffleArr([term.term, ...distractors], rng).map(formatOption)
      const answerIdx = choices.findIndex(c => c.toLowerCase() === term.term.toLowerCase())
      if (answerIdx === -1) return null
      return { type, stem: blankTerm(cand.text, term.term), choices, answerIndex: answerIdx }
    }
    case 'id': {
      const re = new RegExp(term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      return { type, clue: cand.text.replace(re, '\u2026\u2026\u2026'), answer: term.term }
    }
    case 'short': {
      const prompt = buildShortPrompt(cand.text, term.term)
      return {
        type,
        prompt,
        answer: term.term,
        meta: { sentence: cand.text, term: term.term }
      }
    }
    default:
      return null
  }
}

function termIn(weakSet, text) {
  const lower = ' ' + text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ') + ' '
  for (const w of weakSet) {
    if (lower.includes(w.length > 2 && !/\s/.test(w) ? ` ${w} ` : w)) return w
  }
  return ''
}

function buildMatchingSet(rng, allTerms, tierTerms, sentPool, usedSentences, usedTerms, config) {
  const pairCount = Math.max(3, Math.min(6, Math.round(config.count / 2)))
  const pairs = []
  for (const s of sentPool) {
    if (pairs.length >= pairCount) break
    if (usedSentences.has(s.text)) continue
    const term = findTermInSentence(s.text, allTerms.filter(t => !usedTerms.has(t.term)).concat(tierTerms))
    if (!term) continue
    usedSentences.add(s.text)
    usedTerms.add(term.term)
    pairs.push({ left: titleCase(term.term), right: s.text })
  }
  if (pairs.length < 3) return null
  const rightOrder = shuffleArr(pairs.map((_, i) => i), rng)
  return { type: 'matching', prompt: 'Match each term to the sentence that defines it', pairs, rightOrder }
}

function splitOrderedParts(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  let raw = cleaned.split(/;\s*/)
  if (raw.length < 3) raw = cleaned.split(/,\s*/)
  if (raw.length < 3) raw = cleaned.split(/\s+and\s+/i)
  const parts = raw.map(p => p.trim()).filter(p => p.split(/\s+/).length >= 2)
  if (parts.length < 3 || parts.length > 6) return null
  return parts
}

function buildOrderingSet(rng, sentPool, usedSentences, terms) {
  for (const s of sentPool) {
    if (usedSentences.has(s.text)) continue
    const parts = splitOrderedParts(s.text)
    if (!parts) continue
    usedSentences.add(s.text)
    const shuffled = shuffleArr(parts.map((_, i) => i), rng)
    return { type: 'ordering', prompt: 'Put the steps in the correct order', steps: parts, shuffled }
  }
  return null
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Shared prep for the statement-set builders (except / multi): gather the
// next unused candidates without consuming them, plus a falsifier for a
// candidate sentence. Returns { cands, combined }.
function gatherCandidates(sentPool, usedSentences, usedTerms, terms, tierTerms, want) {
  const cands = []
  for (const s of sentPool) {
    if (cands.length >= want) break
    if (usedSentences.has(s.text)) continue
    const term = findTermInSentence(s.text, terms.filter(t => !usedTerms.has(t.term)).concat(tierTerms))
    if (!term) continue
    cands.push({ ...s, term })
  }
  return cands
}

// Falsify a candidate sentence: swap its term (or any other proper/phrase
// term present in the sentence) with a distractor, else tweak a number.
function falsify(cand, combined, rng) {
  const tried = new Set()
  const attempt = t => {
    if (!t || tried.has(t.term)) return null
    tried.add(t.term)
    const s = swapWithDistractor(cand.text, t, combined, rng)
    return s && s !== cand.text ? s : null
  }
  let out = attempt(cand.term)
  if (out) return out
  for (const t of combined) {
    if (!t.proper && !t.phrase) continue
    out = attempt(t)
    if (out) return out
  }
  const tweaked = tweakNumbers(cand.text, rng)
  return tweaked && tweaked !== cand.text ? tweaked : null
}

function consume(cands, usedSentences, usedTerms) {
  for (const c of cands) {
    usedSentences.add(c.text)
    usedTerms.add(c.term.term)
  }
}

const stripEnd = s => s.replace(/[.!?…]+$/, '')

// "All of the following are true EXCEPT" — three true statements from the
// document, one falsified via a distractor swap or number tweak.
function buildExceptQuestion(rng, sentPool, usedSentences, usedTerms, terms, tierTerms) {
  const cands = gatherCandidates(sentPool, usedSentences, usedTerms, terms, tierTerms, 4)
  if (cands.length < 4) return null
  const combined = terms.concat(tierTerms.filter(t => !terms.includes(t)))
  const options = cands.map(c => stripEnd(c.text))
  let falseIdx = -1
  for (const i of shuffleArr(cands.map((_, k) => k), rng)) {
    const bad = falsify(cands[i], combined, rng)
    if (bad) { options[i] = stripEnd(bad); falseIdx = i; break }
  }
  if (falseIdx === -1) return null
  const shuffled = shuffleArr(options.map((_, i) => i), rng)
  const shuffledOptions = shuffled.map(i => options[i])
  const answerIndex = shuffledOptions.indexOf(options[falseIdx])
  consume(cands, usedSentences, usedTerms)
  return {
    type: 'except',
    stem: 'All of the following statements are true EXCEPT:',
    options: shuffledOptions,
    answerIndex,
    meta: { sentence: cands[falseIdx].text, term: cands[falseIdx].term.term }
  }
}

// "Select TWO correct statements" — two untouched statements hiding among
// three falsified ones. Graded by exact set match.
function buildMultiQuestion(rng, sentPool, usedSentences, usedTerms, terms, tierTerms) {
  const cands = gatherCandidates(sentPool, usedSentences, usedTerms, terms, tierTerms, 6)
  if (cands.length < 5) return null
  const combined = terms.concat(tierTerms.filter(t => !terms.includes(t)))
  // Falsify every candidate that CAN be falsified; need 3 false + 2 true.
  const falsified = []
  const stayedTrue = []
  for (const c of cands) {
    const bad = falsify(c, combined, rng)
    if (bad && falsified.length < 3) falsified.push({ c, bad })
    else stayedTrue.push(c)
  }
  if (falsified.length < 3 || stayedTrue.length < 2) return null
  const options = [
    ...stayedTrue.slice(0, 2).map(c => stripEnd(c.text)),
    ...falsified.map(a => stripEnd(a.bad))
  ]
  const shuffled = shuffleArr(options.map((_, i) => i), rng)
  const shuffledOptions = shuffled.map(i => options[i])
  const answerIndices = shuffled
    .map((orig, pos) => (orig < 2 ? pos : -1))
    .filter(p => p !== -1)
    .sort((a, b) => a - b)
  consume([...stayedTrue.slice(0, 2), ...falsified.map(a => a.c)], usedSentences, usedTerms)
  return {
    type: 'multi',
    stem: 'Select TWO correct statements.',
    options: shuffledOptions,
    answerIndices,
    meta: { sentence: falsified[0].c.text, term: falsified[0].c.term.term }
  }
}

export function swapWithDistractor(sentence, term, allTerms, rng) {
  if (!term.proper && !term.phrase) return null
  const properPool = allTerms.filter(t => t.proper || t.phrase)
  const pool = properPool.length >= 4 ? properPool : allTerms
  const distractors = pickImprovedDistractors(term, pool, rng, 4)
  const usable = distractors.find(d => !sentence.toLowerCase().includes(d.toLowerCase()))
  if (!usable) return null
  const re = new RegExp(term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  if (!re.test(sentence)) return null
  const m = sentence.match(re)
  // Never swap into a possessive slot ("Bentham's" → "theories's" is broken).
  if (sentence[m.index + m[0].length] === "'") return null
  const cand = allTerms.find(t => t.term === usable)
  let replacement = usable
  if (m.index === 0) {
    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1)
  } else if (cand && !cand.proper) {
    // A common phrase replacing a proper noun mid-sentence stays lowercase —
    // "developed by Bentham and Basic ethical theories" reads as a bug.
    replacement = replacement.charAt(0).toLowerCase() + replacement.slice(1)
  }
  return sentence.replace(re, replacement)
}

function require_hash(str) {
  let h = 5381 >>> 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return h >>> 0
}
