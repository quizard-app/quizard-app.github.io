import { describe, it, expect } from 'vitest'
import { parseKeyText } from '../src/app/core/engine/answerkey.js'

describe('parseKeyText', () => {
  it('parses answer-only lines with numbers', () => {
    const { format, items } = parseKeyText('1. Photosynthesis\n2) Mitochondria\n3 - Chlorophyll')
    expect(format).toBe('answers')
    expect(items[0]).toEqual({ n: 1, question: '', answer: 'Photosynthesis' })
    expect(items[1].n).toBe(2)
    expect(items[2].answer).toBe('Chlorophyll')
  })

  it('parses question + answer with an arrow separator', () => {
    const { format, items } = parseKeyText('1. What do plants use for food? → Photosynthesis')
    expect(format).toBe('qa')
    expect(items[0].question).toBe('What do plants use for food?')
    expect(items[0].answer).toBe('Photosynthesis')
  })

  it('supports other question/answer separators', () => {
    const { items } = parseKeyText('1. Biggest planet? = Jupiter\n2. H2O is — Water')
    expect(items[0].question).toBe('Biggest planet?')
    expect(items[0].answer).toBe('Jupiter')
    expect(items[1].answer).toBe('Water')
  })

  it('parses a compact letter key block', () => {
    const { format, items } = parseKeyText('BCADBACDDA')
    expect(format).toBe('letters')
    expect(items).toHaveLength(10)
    expect(items[0]).toEqual({ n: 1, question: '', answer: 'B' })
    expect(items[9].answer).toBe('A')
  })

  it('parses inline numbered letters like 1.A 2.B 3.C', () => {
    const { format, items } = parseKeyText('1.A 2.B 3.C 4.D 5.B')
    expect(format).toBe('letters')
    expect(items).toHaveLength(5)
    expect(items[3]).toEqual({ n: 4, question: '', answer: 'D' })
  })

  it('does not misread a prose line containing one letter answer', () => {
    const { format } = parseKeyText('1. The powerhouse of the cell is the mitochondria\n2. Water boils at 100 degrees')
    expect(format).toBe('answers')
  })

  it('reports skipped lines that have no answer', () => {
    const { items, notes } = parseKeyText('1. Photosynthesis\n???\n2. Mitochondria')
    expect(items).toHaveLength(2)
    expect(notes).toEqual(['???'])
  })

  it('numbers unnumbered lines sequentially', () => {
    const { items } = parseKeyText('Photosynthesis\nMitochondria')
    expect(items.map(i => i.n)).toEqual([1, 2])
  })

  it('handles empty input', () => {
    const { items } = parseKeyText('')
    expect(items).toEqual([])
  })
})

describe('parseKeyText — letter-prefixed answers', () => {
  // the shape teachers actually hand in: "1. B. Data Integrity"
  const numbered = `1. B. Data Integrity
2. C. Confidentiality
3. A. Professional Ethics
4. D. Accountability`

  it('splits the number, the option letter and the answer text apart', () => {
    const r = parseKeyText(numbered)
    expect(r.format).toBe('keyed')
    expect(r.items).toEqual([
      { n: 1, answerLetter: 'B', question: '', answer: 'Data Integrity' },
      { n: 2, answerLetter: 'C', question: '', answer: 'Confidentiality' },
      { n: 3, answerLetter: 'A', question: '', answer: 'Professional Ethics' },
      { n: 4, answerLetter: 'D', question: '', answer: 'Accountability' },
    ])
    expect(r.notes).toEqual([])
  })

  it('accepts the same shape without the leading number', () => {
    const r = parseKeyText('B. Data Integrity\nC. Confidentiality')
    expect(r.format).toBe('keyed')
    expect(r.items.map(it => [it.n, it.answerLetter, it.answer])).toEqual([
      [1, 'B', 'Data Integrity'],
      [2, 'C', 'Confidentiality'],
    ])
  })

  it('accepts closing brackets and short numeric answers', () => {
    expect(parseKeyText('1) B) Data Integrity\n2) C) 10').items).toEqual([
      { n: 1, answerLetter: 'B', question: '', answer: 'Data Integrity' },
      { n: 2, answerLetter: 'C', question: '', answer: '10' },
    ])
  })

  it('only claims the keyed shape when every line matches it', () => {
    const r = parseKeyText('1. B. Data Integrity\n2. What is X? → Carbon')
    expect(r.format).toBe('qa')
    expect(r.items[0]).toEqual({ n: 1, question: '', answer: 'B. Data Integrity' })
  })

  it('leaves a bare letter key to the letters format', () => {
    expect(parseKeyText('BCADBACD').format).toBe('letters')
    expect(parseKeyText('1.A 2.B 3.C 4.D').format).toBe('letters')
  })
})
