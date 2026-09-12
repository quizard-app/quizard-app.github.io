// Quizard relay — Cloudflare Worker.
// The static GitHub Pages app calls this worker for the optional AI features;
// the worker holds the provider API keys as secrets and rotates across them
// when one hits its limit. Keys never reach the client.
//
// Routes (any prefix works — routed on the last path segment, so the legacy
// /.netlify/functions/... paths keep working too):
//   POST /gemini  { prompt, images?, json?, maxOutputTokens?, temperature? }
//                 -> 200 text/plain (the model's answer)
//   POST /tts     { text, speed? } -> 200 audio/mpeg (Fish Audio wizard voice)
//
// Secrets (npx wrangler secret put ...):
//   GEMINI_KEYS     one or more Gemini API keys, comma/newline separated
//   FISH_API_KEY    https://fish.audio/app/api-keys/
//   FISH_VOICE_ID   the designed "wise old wizard" voice model id
// Vars (wrangler.toml [vars]):
//   GEMINI_MODEL    defaults to gemini-3.5-flash-lite
//   FISH_MODEL      defaults to s2.1-pro-free

const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const FISH_ENDPOINT = 'https://api.fish.audio/v1/tts'
const THROTTLE_MS = 60 * 1000

// worker environment (secrets + vars), assigned on each request in fetch()
let env = {}

const ALLOWED_ORIGINS = new Set([
  'https://quizard-app.github.io',
  // legacy home that may still have open tabs
  'https://quizforge-app.github.io',
  // local dev servers + the Capacitor Android WebView origin
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:4301',
  'http://127.0.0.1:4301',
  'http://localhost:4302',
  'http://127.0.0.1:4302',
  'https://localhost'
])

function corsHeaders(origin) {
  const base = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-quizard-key',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff'
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    base['Access-Control-Allow-Origin'] = origin
    base['Cross-Origin-Resource-Policy'] = 'cross-origin'
  }
  return base
}

// No Origin header = same-origin or a non-browser client: respond without
// ACAO so browsers enforce the allowlist while servers still work.
function isAllowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin)
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'unknown'
}

// Fixed-window counter, best-effort: worker isolates each hold their own
// counters, so this caps per-isolate abuse rather than providing a global quota.
const buckets = new Map()
function rateLimit(ip, max = 40, windowMs = 60000) {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b || now > b.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
    }
    return true
  }
  if (b.count >= max) return false
  b.count++
  return true
}

function tooLarge(request, limit = 2_000_000) {
  const len = Number(request.headers.get('content-length') || 0)
  return len > limit
}

// ── Gemini key rotation ──
const gemThrottled = new Map()
let gemRr = 0

function getGemKeys() {
  return (env.GEMINI_KEYS || '').split(/[\n\r,]+/).map(k => k.trim()).filter(Boolean)
}
function getGemModel() {
  return (env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()
}
function gemIsThrottled(key) {
  const exp = gemThrottled.get(key)
  if (!exp) return false
  if (Date.now() > exp) { gemThrottled.delete(key); return false }
  return true
}
function gemMarkThrottled(key) { gemThrottled.set(key, Date.now() + THROTTLE_MS) }
// Round-robin so all keys wear evenly; throttled keys go to the back.
function gemCombo(extra) {
  const keys = getGemKeys()
  if (extra && !keys.includes(extra)) keys.push(extra)
  const n = keys.length
  if (!n) return []
  const ordered = []
  for (let i = 0; i < n; i++) ordered.push(keys[(gemRr + i) % n])
  gemRr = (gemRr + 1) % n
  const live = ordered.filter(k => !gemIsThrottled(k))
  return live.length ? live : ordered
}

function isQuota(msg, status) {
  if (status === 429) return true
  const m = (msg || '').toLowerCase()
  return /quota|rate[\s_-]?limit|resource_exhausted|exceeded.*limit|too many requests/.test(m)
}

async function callGemini(model, key, payload) {
  let res
  try {
    res = await fetch(`${GEMINI_ENDPOINT_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    return { networkError: String(err?.message || err) }
  }
  if (!res.ok) {
    let msg = `gemini_http_${res.status}`
    try { const b = await res.json(); msg = b?.error?.message || msg } catch { /* keep */ }
    if (isQuota(msg, res.status)) { gemMarkThrottled(key); return { error: msg } }
    return { fatal: msg }
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ?? ''
  return { text }
}

async function handleGemini(request, sec) {
  let body
  try {
    body = await request.json()
  } catch {
    return fail(400, 'invalid_json', sec)
  }
  const prompt = body.prompt
  const images = Array.isArray(body.images) ? body.images : []
  const json = body.json !== false
  const maxOutputTokens = Number(body.maxOutputTokens) || 2048
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.4

  const parts = [{ text: prompt }]
  for (const im of images) {
    if (im?.data && im?.mimeType) parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } })
  }
  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(json ? { responseMimeType: 'application/json' } : {})
    }
  }

  // The client may carry its own personal key (Settings → AI question writing).
  // Server keys rotate first; the personal key is the last resort.
  const personal = (request.headers.get('x-quizard-key') || '').trim().slice(0, 300) || null
  if (!getGemKeys().length && !personal) {
    return fail(503, 'no_keys_configured', sec)
  }

  const model = getGemModel()
  const combos = gemCombo(personal)
  let lastErr = null
  for (const key of combos) {
    if (gemIsThrottled(key)) continue
    const r = await callGemini(model, key, payload)
    if (r.networkError) { lastErr = r.networkError; continue }
    if (r.fatal) return fail(502, r.fatal, sec)
    if (r.error) { lastErr = r.error; continue }
    return ok(r.text, sec)
  }
  return fail(429, lastErr || 'all_keys_throttled', sec)
}

// ── Fish Audio wizard voice ──
async function handleTts(request, sec) {
  const key = (env.FISH_API_KEY || '').trim()
  const voiceId = (env.FISH_VOICE_ID || '').trim()
  if (!key || !voiceId) {
    return fail(503, 'fish_not_configured', sec)
  }
  let body
  try {
    body = await request.json()
  } catch {
    return fail(400, 'invalid_json', sec)
  }
  const text = String(body.text || '').slice(0, 2000).trim()
  if (!text) return fail(400, 'empty_text', sec)
  const speed = Math.min(2, Math.max(0.5, Number(body.speed) || 0.95))

  // Fish Audio's free tier occasionally answers 503/429 — retry briefly.
  let res = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(FISH_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          model: (env.FISH_MODEL || 's2.1-pro-free').trim()
        },
        body: JSON.stringify({
          text,
          reference_id: voiceId,
          format: 'mp3',
          prosody: { speed, volume: 0 }
        })
      })
      if (res.ok) break
      if (attempt < 3 && (res.status === 503 || res.status === 429)) {
        await new Promise(r => setTimeout(r, 900 * attempt))
        continue
      }
      return fail(502, `fish_error_${res.status}`, sec)
    } catch {
      if (attempt === 3) return fail(502, 'fish_unreachable', sec)
      await new Promise(r => setTimeout(r, 900 * attempt))
    }
  }
  return new Response(res.body, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400', ...sec }
  })
}

function ok(text, headers = {}) {
  return new Response(text, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers } })
}
function fail(status, msg, headers = {}) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

export default {
  async fetch(request, workerEnv) {
    env = workerEnv
    const origin = request.headers.get('origin')
    const sec = corsHeaders(origin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: sec })
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: sec })
    if (!isAllowedOrigin(origin)) return fail(403, 'origin_not_allowed', sec)

    const route = (new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop() || '').toLowerCase()
    if (route === 'gemini') {
      if (rateLimit(clientIp(request), 40) === false) return fail(429, 'rate_limited', sec)
      if (tooLarge(request)) return fail(413, 'payload_too_large', sec)
      return handleGemini(request, sec)
    }
    if (route === 'tts') {
      if (rateLimit(clientIp(request), 60) === false) return fail(429, 'rate_limited', sec)
      if (tooLarge(request, 100_000)) return fail(413, 'payload_too_large', sec)
      return handleTts(request, sec)
    }
    return fail(404, 'unknown_route', sec)
  }
}
