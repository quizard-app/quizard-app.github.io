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
