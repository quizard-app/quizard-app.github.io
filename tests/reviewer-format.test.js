import { describe, it, expect } from 'vitest'
import 'fake-indexeddb/auto'

import { sanitizeReviewer, reviewerToHtml } from '../src/app/core/engine/reviewer-ai.js'

const RAW = {
  title: 'IT Ethics — Exam Reviewer',
  intro: 'Covers morality, ethics, law and the five theories.',
  parts: [
    {
      title: 'PART I — FOUNDATION OF ETHICS',
      sections: [
        {
          num: 1,
          heading: 'Ethics, Morality, and Law',
          stars: 3,
          mustKnow: 'VERY exam-worthy',
          definition: 'Ethics = a reasoned framework for evaluating moral beliefs',
          explanation: 'The three guide behavior at different levels.',
          terms: [
            { term: 'Morality', meaning: 'Meaning: Personal or cultural beliefs about right and wrong.', bullets: ['Upbringing — first source', 'Religion — second source'], memory: 'Morality = Personal' },
            { term: 'Law', meaning: 'Meaning: Formal rules enforced by governments.' }
          ],
          table: { headers: ['Morality', 'Ethics', 'Law'], rows: [['Personal beliefs', 'Reasoned principles', 'Legislation']] },
          mnemonic: 'Recognize → Gather → Identify → Consider → Generate → Evaluate → Act → Reflect',
          important: 'Something can be legal but unethical.',
          memory: 'U-D-V-S-R',
          examClue: '"greatest number" → Utilitarianism'
        },
        // junk section with nothing renderable must be dropped
        { num: 2, heading: 'Empty', explanation: '   ' }
      ]
    }
  ],
  idQuestions: [
    { clue: 'Personal or cultural beliefs about right and wrong', answer: 'Morality' },
    { clue: '', answer: 'nope' }
  ],
  myths: [
    { myth: 'Liking or commenting on a libelous post automatically makes you liable.', fact: 'Mere recipients are protected; the original author is the target.' },
    { myth: '  ', fact: 'nope' }
  ],
  finalReview: ['Utilitarianism = Outcome', 'PAPA = Privacy, Accuracy, Property, Accessibility'],
  highYield: [{ label: 'Five theories', items: ['Utilitarianism → Outcome', 'Deontology → Duty'] }]
}

describe('sanitizeReviewer (extended format)', () => {
  it('keeps sub-terms, stars, mnemonics, id questions and final review', () => {
    const r = sanitizeReviewer(RAW)
    expect(r).toBeTruthy()
    expect(r.parts[0].title).toBe('FOUNDATION OF ETHICS') // "PART I —" stripped
    expect(r.parts[0].sections).toHaveLength(1) // empty section dropped
    const sec = r.parts[0].sections[0]
    expect(sec.stars).toBe(3)
    expect(sec.terms).toHaveLength(2)
    expect(sec.terms[0].meaning).toBe('Personal or cultural beliefs about right and wrong.') // "Meaning:" prefix stripped
    expect(sec.terms[0].memory).toBe('Morality = Personal')
    expect(sec.mnemonic).toContain('→')
    expect(r.idQuestions).toHaveLength(1)
    expect(r.idQuestions[0].answer).toBe('Morality')
    expect(r.myths).toHaveLength(1)
    expect(r.myths[0].fact).toContain('original author')
    expect(r.finalReview).toHaveLength(2)
    expect(r.highYield[0].items).toHaveLength(2)
  })

  it('tolerates the old cached schema (no new fields)', () => {
    const old = { parts: [{ title: 'X', sections: [{ num: 1, heading: 'H', explanation: 'text' }] }], highYield: [] }
    const r = sanitizeReviewer(old)
    expect(r.parts[0].sections[0].terms).toEqual([])
    expect(r.parts[0].sections[0].stars).toBeNull()
    expect(r.idQuestions).toEqual([])
    expect(r.finalReview).toEqual([])
  })
})

describe('reviewerToHtml (extended format)', () => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  it('renders sub-terms, meaning lines, mnemonics, id drills and final review', () => {
    const html = reviewerToHtml(sanitizeReviewer(RAW), esc)
    expect(html).toContain('ai-term-name')
    expect(html).toContain('🔹 Morality')
    expect(html).toContain('ai-term-label')
    expect(html).toContain('Meaning:')
    expect(html).not.toContain('Meaning: Meaning:') // prefix stripped once
    expect(html).toContain('⭐⭐⭐')
    expect(html).toContain('ai-mnemonic')
    expect(html).toContain('Recognize → Gather')
    expect(html).toContain('Possible Identification Questions')
    expect(html).toContain('→ Morality')
    expect(html).toContain('Myths vs Facts')
    expect(html).toContain('❌')
    expect(html).toContain('✅')
    expect(html).toContain('One-Minute Final Review')
    expect(html).toContain('ai-def-term') // "Utilitarianism = Outcome" as def line
    expect(html).toContain('Super Important Exam Points')
    expect(html).toContain("If you're short on study time")
  })

  it('renders an old-schema reviewer without the new blocks', () => {
    const old = sanitizeReviewer({ parts: [{ title: 'X', sections: [{ num: 1, heading: 'H', explanation: 'text' }] }] })
    const html = reviewerToHtml(old, esc)
    expect(html).not.toContain('ai-term-name')
    expect(html).not.toContain('Possible Identification Questions')
    expect(html).not.toContain('One-Minute Final Review')
  })
})
