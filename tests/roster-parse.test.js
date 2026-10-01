import { describe, it, expect } from 'vitest'
import { parseRoster } from '../src/app/core/engine/roster.js'

describe('parseRoster', () => {
  it('parses one name per line', () => {
    const { students, skipped } = parseRoster('Juan Dela Cruz\nMaria Santos')
    expect(students).toEqual([
      { name: 'Juan Dela Cruz', grade: '', section: '' },
      { name: 'Maria Santos', grade: '', section: '' }
    ])
    expect(skipped).toBe(0)
  })

  it('parses name, grade, section triplets', () => {
    const { students } = parseRoster('Juan Dela Cruz, 8, Sampaguita')
    expect(students[0]).toEqual({ name: 'Juan Dela Cruz', grade: 'Grade 8', section: 'Sampaguita' })
  })

  it('detects a grade-only second column vs a section', () => {
    const withGrade = parseRoster('Maria Santos, Grade 9').students[0]
    expect(withGrade.grade).toBe('Grade 9')
    expect(withGrade.section).toBe('')
    const withSection = parseRoster('Ana Reyes, Sampaguita').students[0]
    expect(withSection.grade).toBe('')
    expect(withSection.section).toBe('Sampaguita')
  })

  it('skips a header line and blank lines', () => {
    const { students, skipped } = parseRoster('Name, Grade, Section\n\nJuan, 7, Molave')
    expect(students).toHaveLength(1)
    expect(students[0].name).toBe('Juan')
    expect(skipped).toBe(0)
  })

  it('tolerates tabs and semicolons as separators', () => {
    const { students } = parseRoster('Juan Dela Cruz\t8\tSampaguita\nAna Reyes; 7; Molave')
    expect(students[0].section).toBe('Sampaguita')
    expect(students[1].section).toBe('Molave')
  })

  it('counts lines without a name as skipped', () => {
    const { students, skipped } = parseRoster('Juan\n, 8, Sampaguita')
    expect(students).toHaveLength(1)
    expect(skipped).toBe(1)
  })

  it('handles empty input', () => {
    const { students } = parseRoster('')
    expect(students).toEqual([])
  })
})
