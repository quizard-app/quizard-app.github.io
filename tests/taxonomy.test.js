import { describe, it, expect } from 'vitest'
import { deriveFolders, deriveTags, folderCounts, mergeFolders } from '../src/app/core/engine/taxonomy.js'

const docs = [
  { folder: 'A', tags: ['x', 'y'] },
  { folder: 'A', tags: ['y', 'z'] },
  { folder: null, tags: [] },
  { folder: 'B', tags: ['x'] }
]

describe('taxonomy', () => {
  it('derives sorted unique folders, ignoring nulls', () => {
    expect(deriveFolders(docs)).toEqual(['A', 'B'])
  })

  it('derives sorted unique tags', () => {
    expect(deriveTags(docs)).toEqual(['x', 'y', 'z'])
  })

  it('handles empty input', () => {
    expect(deriveFolders([])).toEqual([])
    expect(deriveTags(null)).toEqual([])
  })
})

describe('folderCounts', () => {
  it('counts documents per folder', () => {
    const counts = folderCounts(docs)
    expect(counts.get('A')).toBe(2)
    expect(counts.get('B')).toBe(1)
    expect(counts.size).toBe(2)
  })

  it('ignores unfiled documents and empty input', () => {
    expect(folderCounts([{ folder: null }, {}]).size).toBe(0)
    expect(folderCounts([]).size).toBe(0)
    expect(folderCounts(null).size).toBe(0)
  })
})

describe('mergeFolders', () => {
  it('unions derived and custom folders, sorted, no duplicates', () => {
    expect(mergeFolders(['B', 'A'], ['B', 'C'])).toEqual(['A', 'B', 'C'])
  })

  it('keeps custom folders that have no documents yet', () => {
    expect(mergeFolders([], ['Ethics Midterm'])).toEqual(['Ethics Midterm'])
  })

  it('handles missing custom list', () => {
    expect(mergeFolders(['A'], null)).toEqual(['A'])
    expect(mergeFolders(null, null)).toEqual([])
  })
})
