// Quizard relay — Cloudflare Worker.
// The static GitHub Pages app calls this worker for the optional AI features;
// the worker holds the provider API keys as secrets and rotates across them
// when one hits its limit. Keys never reach the client.
//
// Routes (any prefix works — routed on the last path segment, so the legacy
// /.netlify/functions/... paths keep working too):
//   POST /gemini  { prompt, images?, json?, maxOutputTokens?, temperature?, responseSchema?, shape? }
//                 -> 200 text/plain (the model's answer)
//                 `shape` is 'array' when the caller parses a top-level JSON
//                 array (all question authoring), else 'object' (the default).
//                 Provider order: Gemini (rotating keys, model fallback
//                 lite↔flash on capacity) → Groq (gpt-oss, shape-aware JSON
//                 handling) as the last-resort provider when every Gemini
//                 attempt failed.
//   POST /tts     { text, speed? } -> 200 audio/mpeg (Fish Audio wizard voice)
//
// Secrets (npx wrangler secret put ...):
//   GEMINI_KEYS     one or more Gemini API keys, comma/newline separated
//   GROQ_API_KEY    optional Groq key(s) (console.groq.com) — fallback
//                   provider; comma/newline separated, rotated the same way
//   FISH_API_KEY    https://fish.audio/app/api-keys/
//   FISH_VOICE_ID   the designed "wise old wizard" voice model id
// Vars (wrangler.toml [vars]):
//   GEMINI_MODEL    primary model (default gemini-3.5-flash-lite; the worker
//                   falls back to the sibling model on 503 high demand)
//   GROQ_MODEL      defaults to openai/gpt-oss-120b
//   FISH_MODEL      defaults to s2.1-pro-free

const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
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

function getGemKeys() {
  return (env.GEMINI_KEYS || '').split(/[\n\r,]+/).map(k => k.trim()).filter(Boolean)
}
function getGemModel() {
  return (env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()
}
// Capacity fallback: when the primary model answers "high demand" (503), the
// request is retried once on the sibling model — lite and flash draw from
// separate capacity pools, so one hot model stops breaking generation.
function getFallbackModel(primary) {
  return /lite/i.test(primary) ? 'gemini-3.5-flash' : 'gemini-3.5-flash-lite'
}
function gemIsThrottled(key) {
  const exp = gemThrottled.get(key)
  if (!exp) return false
  if (Date.now() > exp) { gemThrottled.delete(key); return false }
  return true
}
function gemMarkThrottled(key) { gemThrottled.set(key, Date.now() + THROTTLE_MS) }
// Priority order: the first key in .env is always tried first for every
// request; the rest are fallbacks in listed order. Throttled keys sink to
// the back until their 60s park expires. The personal key stays last resort.
function gemCombo(extra) {
  const keys = getGemKeys()
  if (extra && !keys.includes(extra)) keys.push(extra)
  const live = keys.filter(k => !gemIsThrottled(k))
  const parked = keys.filter(k => gemIsThrottled(k))
  return [...live, ...parked]
}

function isQuota(msg, status) {
  if (status === 429) return true
  const m = (msg || '').toLowerCase()
  // True per-key quota signals: park the key and rotate to the next one.
  return /quota|rate[\s_-]?limit|resource_exhausted|exceeded.*limit|too many requests/.test(m)
}
// Model-capacity signals ("high demand" 503, overload): the KEY is fine —
// parking it would burn the pool for nothing. These trigger the model
// fallback instead (lite ↔ flash draw from separate capacity pools).
function isCapacity(msg, status) {
  if (status === 503) return true
  const m = (msg || '').toLowerCase()
  return /high demand|overloaded|temporarily unavailable/.test(m)
}

// One slow key must not stall the whole pool, but real quiz generation
// (JSON, thousands of output tokens) routinely needs >12s — 12s killed every
// attempt mid-stream, burned the whole key list, then surfaced as 502/error.
const KEY_TIMEOUT_MS = 25_000

async function callGemini(model, key, payload) {
  let res
  try {
    res = await fetch(`${GEMINI_ENDPOINT_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(KEY_TIMEOUT_MS)
    })
  } catch (err) {
    const msg = String(err?.message || err || '')
    // Timeout means the model (or network) is slow for this payload — not a
    // per-key problem. Rotating through every remaining key just multiplies
    // the wait and the client aborts first. Stop after the first timeout.
    if (err?.name === 'TimeoutError' || /timeout|abort/i.test(msg)) {
      return { stop: true, networkError: msg || 'timeout' }
    }
    return { networkError: msg }
  }
  if (!res.ok) {
    let msg = `gemini_http_${res.status}`
    try { const b = await res.json(); msg = b?.error?.message || msg } catch { /* keep */ }
    if (isCapacity(msg, res.status)) return { capacity: msg }
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
  // Expected top-level JSON shape: 'array' (question authoring — parsed with
  // extractJSONArray) or 'object' (everything else). Anything else (or an
  // absent shape) keeps the historical object behaviour.
  const shape = body.shape === 'array' ? 'array' : 'object'

  const parts = [{ text: prompt }]
  for (const im of images) {
    if (im?.data && im?.mimeType) parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } })
  }
  // Optional strict JSON schema (Gemini structured output) — when present it
  // forces responseMimeType too, since the API requires the pair.
  const schema = body.responseSchema && typeof body.responseSchema === 'object' ? body.responseSchema : null
  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(schema
        ? { responseMimeType: 'application/json', responseSchema: schema }
        : json ? { responseMimeType: 'application/json' } : {})
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
  let quotaSeen = false
  let capacitySeen = false
  // One pass across every live key on the given model. Returns the answer
  // text, or null when every key failed (lastErr/quotaSeen/capacitySeen say why).
  const runPool = async (modelName) => {
    for (const key of combos) {
      if (gemIsThrottled(key)) continue
      const r = await callGemini(modelName, key, payload)
      if (r.stop) { lastErr = r.networkError; break }
      if (r.networkError) { lastErr = r.networkError; continue }
      // One bad or exhausted key must never poison the rest of the pool:
      // park it briefly and try the next one. Only when every key has failed
      // do we answer with an error.
      if (r.capacity) { lastErr = r.capacity; capacitySeen = true; continue }
      if (r.error) { lastErr = r.error; quotaSeen = true; continue }
      if (r.fatal) { lastErr = r.fatal; gemMarkThrottled(key); continue }
      return r.text
    }
    return null
  }
  let text = await runPool(model)
  // Primary model out of capacity (503 high demand)? The keys are fine —
  // retry the same request on the sibling model (lite ↔ flash) once.
  if (text == null && capacitySeen) {
    text = await runPool(getFallbackModel(model))
  }
  // Every Gemini attempt failed and a Groq key is configured — try the
  // independent provider before giving up. Groq's JSON mode needs the word
  // "JSON" in the prompt, which every generation prompt already contains.
  if (text == null) {
    const g = await callGroq(prompt, Math.min(maxOutputTokens, 8192), temperature, json, shape)
    if (g?.text) return ok(g.text, sec)
  }
  if (text != null) return ok(text, sec)
  if (quotaSeen) return fail(429, lastErr || 'all_keys_throttled', sec)
  // Upstream timeout / non-quota failure: 502 so clients can map it to a
  // busy/retryable state instead of a generic unknown error.
  if (/timeout|abort/i.test(String(lastErr || ''))) return fail(504, 'upstream_timeout', sec)
  return fail(502, lastErr || 'all_keys_throttled', sec)
}

// ── Groq fallback provider (gpt-oss, OpenAI-compatible) ──
// Used only when every Gemini attempt failed (quota, capacity or upstream
// timeout). Groq's infrastructure is independent of Google's, so its bad
// days never line up with Gemini's. GROQ_API_KEY may hold several keys
// (comma/newline separated, one per Groq account — limits are per
// organization, so extra keys from the same account add nothing); a key
// that answers 429 is parked for 60s while the rest take over.
const groqThrottled = new Map()

function getGroqKeys() {
  return (env.GROQ_API_KEY || '').split(/[\n\r,]+/).map(k => k.trim()).filter(Boolean)
}
function groqIsThrottled(key) {
  const exp = groqThrottled.get(key)
  if (!exp) return false
  if (Date.now() > exp) { groqThrottled.delete(key); return false }
  return true
}
function groqMarkThrottled(key) { groqThrottled.set(key, Date.now() + THROTTLE_MS) }

async function callGroq(prompt, maxOutputTokens, temperature, json, shape = 'object') {
  const keys = getGroqKeys()
  if (!keys.length) return null
  const model = (env.GROQ_MODEL || 'openai/gpt-oss-120b').trim()
  // gpt-oss is a reasoning model: it spends completion tokens thinking before
  // it answers, so a small max_tokens comes back with empty content (all
  // budget eaten by reasoning). Keep the effort low and guarantee a budget
  // that always leaves room for the actual answer.
  const isReasoner = /gpt-oss/i.test(model)
  const budget = Math.max(isReasoner ? 2048 : 256, maxOutputTokens)
  // Array callers (question authoring) parse a top-level JSON array, which
  // json_object mode forbids outright — it coerces the reply into an object
  // (or 400s array-shaped answers as failed_generation), and the client then
  // parses the wreckage into zero usable questions. So array requests go out
  // with NO response_format: the prompt already says "Reply ONLY with a JSON
  // array", and the reply is verified to contain one before it is accepted.
  const wantArray = json && shape === 'array'
  // Groq's json_object mode hard-requires the word "json" in the messages —
  // otherwise it 400s instantly. Every generation prompt mentions JSON, but a
  // caller that relies on the relay's default (json !== false) might not, so
  // make the request self-sufficient.
  const groqPrompt = !wantArray && json && !/json/i.test(prompt) ? prompt + '\n\nRespond with valid JSON.' : prompt
  const live = keys.filter(k => !groqIsThrottled(k))
  const parked = keys.filter(k => groqIsThrottled(k))
  const order = [...live, ...parked]
  let lastErr = null
  for (const key of order) {
    let res
    try {
      res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: groqPrompt }],
          temperature,
          max_tokens: budget,
          ...(isReasoner ? { reasoning_effort: 'low' } : {}),
          ...(!wantArray && json ? { response_format: { type: 'json_object' } } : {})
        }),
        signal: AbortSignal.timeout(KEY_TIMEOUT_MS)
      })
    } catch (err) {
      lastErr = String(err?.message || err || 'groq_error')
      continue
    }
    if (!res.ok) {
      let msg = `groq_http_${res.status}`
      try { const b = await res.json(); msg = b?.error?.message || msg } catch { /* keep */ }
      // Strict object-mode JSON rejects the ENTIRE completion when the model's
      // answer isn't parseable JSON ("failed_generation"). One retry with a
      // blunt JSON-only instruction usually un-sticks the model. (Array
      // requests never set response_format, so this error can't occur for
      // them — their shape is verified on success below instead.)
      if (!wantArray && json && res.status === 400 && /failed_generation|generate json/i.test(msg)) {
        try {
          const retry = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: groqPrompt + '\n\nIMPORTANT: Your ENTIRE reply must be one valid JSON object. No prose, no markdown, nothing outside the JSON.' }],
              temperature,
              max_tokens: budget,
              ...(isReasoner ? { reasoning_effort: 'low' } : {}),
              response_format: { type: 'json_object' }
            }),
            signal: AbortSignal.timeout(KEY_TIMEOUT_MS)
          })
          if (retry.ok) {
            const rd = await retry.json().catch(() => null)
            const rt = rd?.choices?.[0]?.message?.content ?? ''
            if (rt) return { text: rt }
          }
        } catch { /* fall through to the error path */ }
      }
      lastErr = msg
      // Rate limited on this account: park the key, let the next one through.
      if (res.status === 429 || /rate[\s_-]?limit|quota|too many requests/i.test(msg)) {
        groqMarkThrottled(key)
        continue
      }
      // Auth/other hard errors are key-specific too, but a 401 is likely a
      // bad key — skip it rather than returning failure while others remain.
      if (res.status === 401 || res.status === 403) continue
      return { error: msg }
    }
    const data = await res.json().catch(() => null)
    let text = data?.choices?.[0]?.message?.content ?? ''
    // Array contract: the reply must contain a JSON array, otherwise the
    // client's extractJSONArray yields nothing and the whole fallback was
    // wasted. One retry with a blunt array-only instruction, mirroring the
    // object-mode retry above (failure-path only — never on success).
    if (wantArray && !/\[[\s\S]*\]/.test(text)) {
      try {
        const retry = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: groqPrompt + '\n\nIMPORTANT: Your ENTIRE reply must be one valid JSON array. No prose, no markdown, nothing outside the array.' }],
            temperature,
            max_tokens: budget,
            ...(isReasoner ? { reasoning_effort: 'low' } : {})
          }),
          signal: AbortSignal.timeout(KEY_TIMEOUT_MS)
        })
        if (retry.ok) {
          const rd = await retry.json().catch(() => null)
          const rt = rd?.choices?.[0]?.message?.content ?? ''
          if (rt) text = rt
        }
      } catch { /* fall through with the original text */ }
    }
    return { text: text || null }
  }
  return { error: lastErr || 'groq_error' }
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
