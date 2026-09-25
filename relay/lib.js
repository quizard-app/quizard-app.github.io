// Pure HTML → text helpers for the /extract route. No Cloudflare-specific APIs
// here so they can be unit-tested with vitest.

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', middot: '·', copy: '©', reg: '®', trade: '™',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä'
}

export function decodeEntities(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)) } catch { return ' ' } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(Number(d)) } catch { return ' ' } })
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

// Turn a (script/style-free) HTML page into readable text. Block-level closing
// tags become line breaks so headings and paragraphs keep their structure;
// everything else is flattened and whitespace-collapsed.
export function htmlToText(html, { maxChars = 200_000 } = {}) {
  if (!html) return ''
  let s = String(html)
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  // Accessibility skip-links ("Jump to content", "Skip to main content").
  s = s.replace(/<a[^>]*>\s*(?:jump|skip) to (?:main\s+)?content[^<]*<\/a>/gi, ' ')
  // Non-content containers whose innards would pollute the text.
  s = s.replace(/<(script|style|noscript|template|svg|iframe|canvas|nav|aside|form|button|select|option|input|label|footer)[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
  // Block-level endings become newlines.
  s = s.replace(/<\/(p|div|section|article|header|h[1-6]|li|tr|blockquote|pre|figcaption|main|table|ul|ol|dl|dd|dt|td|th)>/gi, '\n')
  s = s.replace(/<br[^>]*>/gi, '\n')
  // Whatever tags remain carry no text.
  s = s.replace(/<[^>]+>/g, ' ')
  s = decodeEntities(s)
  const lines = s.split('\n').map(l => l.replace(/[ \t\u00a0]+/g, ' ').trim()).filter(Boolean)
  let text = lines.join('\n').replace(/\n{3,}/g, '\n\n')
  if (text.length > maxChars) text = text.slice(0, maxChars)
  return text
}

// Best-effort page title: og:title meta, then <title>, then the first <h1>.
export function pickTitle(html) {
  const og = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(html)
    || /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i.exec(html)
  if (og && og[1].trim()) return decodeEntities(og[1]).replace(/\s+/g, ' ').trim()
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  if (t && t[1].trim()) return decodeEntities(t[1]).replace(/\s+/g, ' ').trim()
  const h = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  if (h) return decodeEntities(h[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  return ''
}
