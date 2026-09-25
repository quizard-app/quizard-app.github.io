import { describe, it, expect } from 'vitest'
import { htmlToText, pickTitle, decodeEntities } from '../relay/lib.js'

describe('htmlToText', () => {
  it('drops script and style content entirely', () => {
    const html = '<html><head><style>.a{color:red}</style><script>var x=1;</script></head>' +
      '<body><p>Real content here</p></body></html>'
    const text = htmlToText(html)
    expect(text).toContain('Real content here')
    expect(text).not.toContain('color:red')
    expect(text).not.toContain('var x=1')
  })

  it('turns block endings into line breaks so paragraphs survive', () => {
    const text = htmlToText('<h1>Photosynthesis</h1><p>Plants make sugar.</p><p>Light is required.</p>')
    expect(text).toBe('Photosynthesis\nPlants make sugar.\nLight is required.')
  })

  it('decodes common entities', () => {
    expect(htmlToText('<p>A &amp; B &mdash; C</p>')).toBe('A & B — C')
    expect(decodeEntities('&#8212; &#65;')).toBe('— A')
  })

  it('keeps inline tag text but flattens the tags', () => {
    const text = htmlToText('<p>Study <b>hard</b> for the exam</p>')
    expect(text).toContain('Study hard for the exam')
  })

  it('drops navigation junk containers', () => {
    const html = '<nav><a>Home</a><a>Docs</a></nav><p>The actual lesson body</p><footer>© site</footer>'
    const text = htmlToText(html)
    expect(text).toContain('The actual lesson body')
    expect(text).not.toContain('Home')
    expect(text).not.toContain('© site')
  })

  it('collapses whitespace but keeps line structure', () => {
    const text = htmlToText('<p>Line   one</p>\n\n<p>Line two</p>')
    expect(text).toBe('Line one\nLine two')
  })

  it('truncates at maxChars', () => {
    const text = htmlToText('<p>' + 'word '.repeat(1000) + '</p>', { maxChars: 50 })
    expect(text.length).toBeLessThanOrEqual(50)
  })

  it('handles empty input', () => {
    expect(htmlToText('')).toBe('')
    expect(htmlToText(null)).toBe('')
  })
})

describe('pickTitle', () => {
  it('prefers og:title over <title>', () => {
    const html = '<head><title>Fallback Title</title><meta property="og:title" content="The Real Title"></head>'
    expect(pickTitle(html)).toBe('The Real Title')
  })

  it('falls back to <title> then h1', () => {
    expect(pickTitle('<title>Page Title | Site</title><h1>Heading</h1>')).toBe('Page Title | Site')
    expect(pickTitle('<body><h1>Only a heading</h1></body>')).toBe('Only a heading')
  })

  it('decodes entities in the title', () => {
    expect(pickTitle('<title>A &amp; B</title>')).toBe('A & B')
  })

  it('returns empty string without any title source', () => {
    expect(pickTitle('<body><p>nothing</p></body>')).toBe('')
  })
})
