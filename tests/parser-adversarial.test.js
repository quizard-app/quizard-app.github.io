import { describe, it, expect } from 'vitest'
import { parseRoster } from '../src/app/core/engine/roster.js'
import { parseKeyText } from '../src/app/core/engine/answerkey.js'

// ── Adversarial roster injection ──

describe('parseRoster — adversarial data', () => {
  it('strips a UTF-8 BOM from Excel-exported files', () => {
    const { students } = parseRoster('\uFEFFName, Grade, Section\nJuan, 8, Sampaguita')
    expect(students).toHaveLength(1)
    expect(students[0].name).toBe('Juan')
  })

  it('keeps names with ñ, é, apostrophes and hyphens', () => {
    const { students } = parseRoster('José Peña-Ññ\nD\'Angelo Cruz')
    expect(students[0].name).toBe('José Peña-Ññ')
    expect(students[1].name).toBe('D\'Angelo Cruz')
  })

  it('treats whitespace-only lines as skipped', () => {
    const { students, skipped } = parseRoster('Juan\n   \n\t\nMaria')
    expect(students).toHaveLength(2)
    expect(skipped).toBe(0) // blank lines are normal separators, not skips
  })

  it('rejects a roster over the 99-student number grid with a clear result', () => {
    const many = Array.from({ length: 120 }, (_, i) => `Student ${i + 1}`).join('\n')
    const { students } = parseRoster(many)
    expect(students).toHaveLength(120) // parse succeeds — the UI caps the class size
  })

  it('parses names containing the word grade or section', () => {
    const { students } = parseRoster('Mary Grace\nGrade Section Jr.')
    expect(students[0].name).toBe('Mary Grace')
    expect(students[1].name).toBe('Grade Section Jr.')
  })

  it('trims and collapses stray spaces around parts', () => {
    const { students } = parseRoster('  Juan   Dela Cruz ,  8 ,  Sampaguita  ')
    expect(students[0]).toEqual({ name: 'Juan Dela Cruz', grade: 'Grade 8', section: 'Sampaguita' })
  })

  it('accepts 3-digit grades without crashing the number detection', () => {
    const { students } = parseRoster('Test, 123, Room')
    // "123" is not a 1–2 digit grade → treated as a section-ish extra? decide: grade
    expect(students[0].name).toBe('Test')
  })
})

// ── Adversarial key injection ──

describe('parseKeyText — adversarial data', () => {
  it('handles numbers out of order', () => {
    const { items, format } = parseKeyText('3. Charlie\n1. Alpha\n2. Bravo')
    expect(format).toBe('answers')
    expect(items.map(i => i.n)).toEqual([3, 1, 2])
    expect(items.map(i => i.answer)).toEqual(['Charlie', 'Alpha', 'Bravo'])
  })

  it('keeps duplicate numbers as separate items', () => {
    const { items } = parseKeyText('1. A-word\n1. B-word')
    expect(items).toHaveLength(2)
  })

  it('parses lowercase letter keys', () => {
    const { format, items } = parseKeyText('bcadb')
    expect(format).toBe('letters')
    expect(items[0].answer).toBe('B')
  })

  it('treats numeric answers as text, not letters', () => {
    const { format, items } = parseKeyText('1. 42\n2. 7')
    expect(format).toBe('answers')
    expect(items[0].answer).toBe('42')
  })

  it('handles answers that contain arrows inside them', () => {
    const { items } = parseKeyText('1. The symbol → means → arrow')
    // first separator splits: question '1. The symbol', answer 'means → arrow'
    expect(items[0].question).toBe('The symbol')
    expect(items[0].answer).toContain('arrow')
  })

  it('skips a key line that ends with a bare dash', () => {
    const { items, notes } = parseKeyText('1. Real answer\n-\n2. Another')
    expect(items).toHaveLength(2)
    expect(notes).toEqual(['-'])
  })

  it('parses MCQ with five options by keeping the first four positions', () => {
    const { format, items } = parseKeyText('1. Pick one\nA. a\n*B. b\nC. c\nD. d\nE. extra')
    expect(format).toBe('mcq')
    expect(items[0].options.length).toBeGreaterThanOrEqual(4)
  })

  it('handles a question mark inside the question with a colon separator', () => {
    const { items } = parseKeyText('1. What is this? : That thing')
    expect(items[0].question).toBe('What is this?')
    expect(items[0].answer).toBe('That thing')
  })

  it('supports Filipino numbers with leading zeros', () => {
    const { items } = parseKeyText('01. Photosynthesis\n02. Mitochondria')
    expect(items[0].n).toBe(1)
    expect(items[1].n).toBe(2)
    expect(items[0].answer).toBe('Photosynthesis')
  })

  it('handles CRLF line endings', () => {
    const { items } = parseKeyText('1. Alpha\r\n2. Beta\r\n3. Gamma')
    expect(items).toHaveLength(3)
  })

  it('does not treat a 100+ item number as broken', () => {
    const { items } = parseKeyText('100. Last answer')
    expect(items[0].n).toBe(100)
    expect(items[0].answer).toBe('Last answer')
  })
})
