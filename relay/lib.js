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

// ── YouTube transcript helpers ──
export function youTubeVideoId(url) {
  const m = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/.exec(String(url || '').trim())
  return m ? m[1] : ''
}

// Pull a balanced JSON object out of an HTML page right after `marker`
// (brace-matching, string/escape aware — regex cuts through nested JSON).
export function extractJsonAfter(html, marker) {
  const i = html.indexOf(marker)
  if (i < 0) return null
  const start = html.indexOf('{', i)
  if (start < 0) return null
  let depth = 0, inStr = false, esc = false
  for (let j = start; j < html.length; j++) {
    const c = html[j]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
    } else {
      if (c === '"') inStr = true
      else if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) { try { return JSON.parse(html.slice(start, j + 1)) } catch { return null } }
      }
    }
  }
  return null
}

export function extractPlayerResponse(html) {
  return extractJsonAfter(html, 'ytInitialPlayerResponse')
}

// Human captions beat auto-generated ones; English beats the rest.
export function pickCaptionTrack(tracks) {
  if (!Array.isArray(tracks) || !tracks.length) return null
  const score = (t) => {
    let s = 0
    if (String(t.languageCode || '').toLowerCase().startsWith('en')) s += 4
    if (t.kind !== 'asr') s += 2
    return s
  }
  return [...tracks].sort((a, b) => score(b) - score(a))[0] || null
}

// YouTube's json3 caption format: { events: [ { segs: [ { utf8 } ] } ] }.
// Events are grouped into readable ~200-char lines (paragraph-ish breaks).
export function json3ToText(json3) {
  try {
    const data = typeof json3 === 'string' ? JSON.parse(json3) : json3
    const events = Array.isArray(data?.events) ? data.events : []
    const lines = []
    let cur = ''
    const pushLine = () => {
      // Split oversized runs at word boundaries so lines stay readable.
      while (cur.length > 220) {
        let cut = cur.lastIndexOf(' ', 200)
        if (cut < 80) cut = 200
        lines.push(cur.slice(0, cut).trim())
        cur = cur.slice(cut).trim()
      }
      if (cur) { lines.push(cur); cur = '' }
    }
    for (const ev of events) {
      if (!ev.segs) { pushLine(); continue }
      const piece = ev.segs.map(s => s.utf8 || '').join('').replace(/\s+/g, ' ').trim()
      if (!piece) continue
      cur = cur ? cur + ' ' + piece : piece
      if (cur.length > 200) pushLine()
    }
    pushLine()
    return lines.join('\n')
  } catch { return '' }
}

// Legacy timedtext XML fallback: <text dur="…">words</text>
export function timedXmlToText(xml) {
  const out = []
  let cur = ''
  const re = /<text[^>]*>([\s\S]*?)<\/text>/g
  let m
  while ((m = re.exec(xml))) {
    const piece = decodeEntities(m[1]).replace(/\s+/g, ' ').trim()
    if (!piece) continue
    cur = cur ? cur + ' ' + piece : piece
    if (cur.length > 200) { out.push(cur); cur = '' }
  }
  if (cur) out.push(cur)
  return out.join('\n')
}
