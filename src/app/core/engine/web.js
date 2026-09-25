// Relay-backed web page extraction: the browser cannot read cross-origin
// pages (CORS), so the relay worker fetches the URL and strips it to clean
// text. Only public, article-style pages yield usable content — logged-in
// walls and JS-only apps return nothing readable.
const IS_LOCAL = /^localhost$|^127(\.\d+){3}$/.test(globalThis.location?.hostname || '')
const EXTRACT_URL = IS_LOCAL ? '/extract' : 'https://quizard-relay.quizard-app.workers.dev/extract'

export function isProbablyArticleUrl(url) {
  return /^https?:\/\/\S{3,}$/i.test(String(url || '').trim())
}

function friendlyExtractError(code) {
  if (/bad_url/.test(code)) return 'That does not look like a valid link — it should start with https://'
  if (/site_http_40[134]/.test(code)) return 'That page refused the request — it may need a login or block automatic readers. Copy its text into the Paste tab instead'
  if (/site_http_429|site_http_503/.test(code)) return 'That site is rate-limiting us right now — try again in a moment'
  if (/no_readable_text|unsupported_content/.test(code)) return 'Nothing readable on that page — it may need a login or load with JavaScript. Try the Paste tab'
  if (/page_too_large/.test(code)) return 'That page is too large to import'
  if (/fetch_failed|upstream|timeout/.test(code)) return 'Could not reach that site — check the link and try again'
  if (/rate_limited/.test(code)) return 'Too many page reads in a row — wait a minute and try again'
  return 'Could not extract that page — try copying its text into the Paste tab'
}

export function youTubeVideoId(url) {
  const m = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/.exec(String(url || '').trim())
  return m ? m[1] : ''
}

// YouTube's oEmbed endpoint is CORS-open and not bot-gated — good for the
// video title even when the transcript itself can't be fetched.
export async function youTubeTitle(url) {
  const r = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(String(url).trim()) + '&format=json')
  if (!r.ok) throw new Error('Could not read that video')
  const j = await r.json().catch(() => null)
  return { title: String(j?.title || ''), author: String(j?.author_name || '') }
}

export async function extractUrl(url, { timeoutMs = 30_000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res
  try {
    res = await fetch(EXTRACT_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: String(url).trim() })
    })
  } catch (err) {
    throw new Error(err?.name === 'AbortError'
      ? 'That site took too long to respond — try again'
      : 'Network error while reading that page')
  } finally {
    clearTimeout(timer)
  }
  let data = null
  try { data = await res.json() } catch { /* non-JSON error body */ }
  if (!res.ok) {
    // Raw relay code rides along (err.code) so callers can branch on it
    // (e.g. the YouTube guide) without re-parsing the friendly message.
    const code = String(data?.error || `http_${res.status}`)
    const err = new Error(friendlyExtractError(code))
    err.code = code
    throw err
  }
  const text = String(data?.text || '')
  if (text.replace(/\s+/g, '').length < 80) {
    throw new Error('Nothing readable on that page — try copying its text into the Paste tab instead')
  }
  return { title: String(data?.title || '').trim(), text, words: Number(data?.words) || 0, kind: String(data?.kind || 'link') }
}
