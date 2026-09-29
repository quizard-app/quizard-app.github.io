import { describe, it, expect } from 'vitest'
import 'fake-indexeddb/auto'

import {
  splitSlideSections,
  stripSlideMarkers,
  deckOutline,
  slideCoverage,
  rankedAcrossSections,
  sentences,
  termFreq,
  scoreSentences
} from '../src/app/core/engine/textproc.js'
import { sanitizeReviewer, mergeReviewers } from '../src/app/core/engine/reviewer-ai.js'

const DECK = [
  '=== Slide 1 ===',
  'Ethical decision-making in IT',
  'How good people make hard calls under pressure.'
].join('\n')

const body = (n, topic) => [
  `=== Slide ${n} ===`,
  `${topic} basics`,
  `The ${topic} framework guides professional conduct in information technology teams today.`,
  `Students must apply the ${topic} method whenever they face a dilemma at work.`
].join('\n')

const MARKED = [DECK, body(2, 'Utilitarianism'), body(3, 'Deontology'), body(4, 'Virtue ethics')].join('\n\n')
const PLAIN = 'Ethics is the study of right conduct using reasons anyone could inspect and defend publicly today.'

describe('splitSlideSections', () => {
  it('returns null for text without markers', () => {
    expect(splitSlideSections(PLAIN)).toBeNull()
    expect(splitSlideSections('')).toBeNull()
    expect(splitSlideSections('=== Slide 1 ===\nonly one marker')).toBeNull()
  })

  it('splits on slide markers, keeping numbers and bodies', () => {
    const sections = splitSlideSections(MARKED)
    expect(sections.map(s => s.num)).toEqual([1, 2, 3, 4])
    expect(sections[1].text).toContain('Utilitarianism')
    expect(sections[1].text).not.toContain('=== Slide 3 ===')
  })

  it('also parses page markers', () => {
    const pages = splitSlideSections('=== Page 2 ===\nfirst page body text\n\n=== Page 5 ===\nsecond page body text')
    expect(pages.map(s => s.num)).toEqual([2, 5])
  })
})

describe('stripSlideMarkers', () => {
  it('removes marker lines but keeps content', () => {
    const stripped = stripSlideMarkers(MARKED)
    expect(stripped).not.toContain('=== Slide')
    expect(stripped).toContain('Utilitarianism framework guides')
  })
})

describe('deckOutline', () => {
  it('builds a numbered first-line outline', () => {
    const outline = deckOutline(MARKED)
    expect(outline).toContain('1 Ethical decision-making in IT')
    expect(outline).toContain('2 Utilitarianism basics')
    expect(outline).toContain('4 Virtue ethics basics')
  })

  it('returns null without markers', () => {
    expect(deckOutline(PLAIN)).toBeNull()
  })
})

describe('slideCoverage', () => {
  it('returns the slide span', () => {
    expect(slideCoverage(MARKED)).toBe('1–4')
    expect(slideCoverage(PLAIN)).toBeNull()
  })
})

describe('rankedAcrossSections', () => {
  // The last section holds the globally lowest-scoring sentences — under the
  // old global top-N selection they never reach the quiz material pool. The
  // interleaved ranking must surface every section within its first picks.
  const text = MARKED + '\n\n' + body(5, 'Whistleblowing')
  const tf = termFreq(stripSlideMarkers(text))
  const ranked = rankedAcrossSections(text, tf)
  const firstPicks = ranked.slice(0, 5).map(s => s.text)

  it('is ordered but spans every section early', () => {
    const topics = ['Utilitarianism', 'Deontology', 'Virtue ethics', 'Whistleblowing']
    for (const topic of topics) {
      expect(firstPicks.some(s => s.includes(topic))).toBe(true)
    }
  })

  it('never emits marker fragments', () => {
    for (const s of ranked) expect(s.text).not.toContain('===')
  })

  it('falls back to null for unmarked text', () => {
    const tf2 = termFreq(PLAIN)
    const fallback = rankedAcrossSections(PLAIN, tf2)
    expect(fallback).toBeNull()
    // and the global ranking still works for the caller's fallback path
    expect(scoreSentences(sentences(PLAIN), tf2).length).toBeGreaterThan(0)
  })
})

describe('mergeReviewers (chunk fallback)', () => {
  const part = (topic, term) => ({
    title: topic,
    sections: [{ heading: `${topic} section`, explanation: `About ${term}.` }]
  })
  const mk = topic => sanitizeReviewer({
    title: 'Deck Reviewer',
    parts: [part(topic, topic)],
    highYield: [{ label: topic, items: [`${topic} = memory`] }],
    idQuestions: [{ clue: `${topic} clue`, answer: topic }],
    acronyms: [{ acr: 'PAPA', expansion: 'Privacy, Accuracy, Property, Accessibility', meaning: 'Four issues.' }]
  })

  it('concatenates parts and lets sanitizeReviewer renumber sections', () => {
    const merged = mergeReviewers([mk('Ethics'), mk('Cybercrime')])
    expect(merged).not.toBeNull()
    expect(merged.parts.length).toBe(2)
    const nums = merged.parts.flatMap(p => p.sections.map(s => s.num))
    expect(nums).toEqual([1, 2])
    expect(merged.v).toBe(5)
  })

  it('merges global blocks with caps', () => {
    const three = [mk('A'), mk('B'), mk('C')]
    const merged = mergeReviewers(three)
    expect(merged.highYield.length).toBe(3)
    expect(merged.idQuestions.length).toBe(3)
    // duplicate acronyms collapse via sanitizeReviewer's dedupe
    expect(merged.acronyms.length).toBe(1)
  })

  it('returns null for an empty list', () => {
    expect(mergeReviewers([])).toBeNull()
  })
})
