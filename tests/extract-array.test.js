import { describe, it, expect } from 'vitest'
import { extractJSONArray } from '../src/app/core/engine/validate.js'

describe('extractJSONArray', () => {
  it('should extract a top-level array from JSON text', () => {
    const input = '[{"src":0,"kind":"mcq","stem":"Question?","correct":"Answer","wrong":["A","B","C"]}]'
    const result = extractJSONArray(input)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0].src).toBe(0)
    expect(result[0].kind).toBe('mcq')
  })

  it('should extract an array from wrapped JSON text', () => {
    const input = '{"questions": [{"src":0,"kind":"mcq"}]}'
    const result = extractJSONArray(input)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0].src).toBe(0)
  })

  it('should handle the problematic case: object with inner array (old Groq behavior)', () => {
    // This simulates the problematic case where Groq's json_object mode
    // would return an object instead of an array
    const input = '{"src":0,"kind":"mcq","stem":"Question?","correct":"Answer","wrong":["A","B","C"]}'
    const result = extractJSONArray(input)
    
    // With the old behavior, this would extract the "wrong" array instead of recognizing
    // that there are no actual question objects
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3) // Would extract ["A","B","C"] instead of the question
    expect(typeof result[0]).toBe('string') // Elements are strings, not question objects
    
    // This demonstrates WHY the fix is needed - the old Groq behavior breaks array parsing
  })

  it('should handle empty or invalid input gracefully', () => {
    expect(extractJSONArray('')).toBeNull()
    expect(extractJSONArray('not json')).toBeNull()
    expect(extractJSONArray('{"not": "array"}')).toBeNull()
  })

  it('should handle JSON with code fences', () => {
    const input = '```json\n[{"src":0}]\n```'
    const result = extractJSONArray(input)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
  })
})