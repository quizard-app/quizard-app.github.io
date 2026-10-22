import { describe, it, expect } from 'vitest'
import { parseKeyText } from '../src/app/core/engine/answerkey.js'

const MCQ_TEXT = [
  '1. What do plants use for food?',
  'A. Respiration',
  '*B. Photosynthesis',
  'C. Digestion',
  'D. Evaporation',
  '',
  '2. Biggest planet?',
  'A. Mars',
  'B. Venus',
  'C. Jupiter',
  'D. Saturn',
  'Answer: C'
].join('\n')

describe('parseKeyText — MCQ examples', () => {
  it('parses starred options and Answer: lines', () => {
    const { format, items, notes } = parseKeyText(MCQ_TEXT)
    expect(format).toBe('mcq')
    expect(items).toHaveLength(2)
    expect(items[0].question).toBe('What do plants use for food?')
    expect(items[0].options).toHaveLength(4)
    expect(items[0].answerIndex).toBe(1)
    expect(items[1].question).toBe('Biggest planet?')
    expect(items[1].answerIndex).toBe(2)
    expect(notes).toHaveLength(0)
  })

  it('marks missing answers with answerIndex -1 for the review screen', () => {
    const { items } = parseKeyText('1. What is X?\nA. one\nB. two\nC. three\nD. four')
    expect(items[0].answerIndex).toBe(-1)
  })

  it('does not mistake answer-only lists for MCQ blocks', () => {
    const { format } = parseKeyText('1. Photosynthesis\n2. Mitochondria\n3. Chlorophyll')
    expect(format).toBe('answers')
  })

  it('still parses simple and letter keys after the parser change', () => {
    expect(parseKeyText('BCADB').format).toBe('letters')
    expect(parseKeyText('1.A 2.B 3.C').format).toBe('letters')
    expect(parseKeyText('1. Photosynthesis').format).toBe('answers')
  })

  it('accepts the full answer text after the letter (Answer: A. Central Processing Unit)', () => {
    const text = [
      '1. What does CPU stand for?',
      'A. Central Processing Unit',
      'B. Computer Personal Unit',
      'C. Central Program Utility',
      'D. Control Processing User',
      'Answer: A. Central Processing Unit',
      '',
      '2. Which type of memory is volatile?',
      'A. ROM',
      'B. SSD',
      'C. Hard disk',
      'D. RAM',
      'Answer: D. RAM'
    ].join('\n')
    const { format, items, notes } = parseKeyText(text)
    expect(format).toBe('mcq')
    expect(items).toHaveLength(2)
    expect(items[0].question).toBe('What does CPU stand for?')
    expect(items[0].answerIndex).toBe(0)
    expect(items[1].question).toBe('Which type of memory is volatile?')
    expect(items[1].answerIndex).toBe(3)
    expect(notes).toHaveLength(0)
  })

  it('does not mistake a word answer for a letter line', () => {
    const text = [
      '1. What is X?',
      'A. one',
      'B. two',
      'C. three',
      'D. four',
      'Answer: About five'
    ].join('\n')
    const { format, items } = parseKeyText(text)
    expect(format).toBe('mcq')
    expect(items[0].answerIndex).toBe(-1)
  })
})
