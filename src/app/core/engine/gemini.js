// The app talks to our relay worker (a free Cloudflare Worker at VITE_API_BASE)
// which holds the provider API keys server-side and rotates across them when
// one hits its limit — users never need a key. Optionally, a personal Gemini
// key (Settings) is sent along as a last-resort fallback if every relay key
// is throttled; it is also used for direct Google calls when no relay is
// configured (e.g. local dev without the relay).

export const MODEL_LABEL = 'gemini-3.5-flash'

// The relay only accepts the production origin, so on localhost the dev server
// (scripts/local-dev-server.mjs) proxies /gemini to it — same-origin, no CORS.
const IS_LOCAL = /^localhost$|^127(\.\d+){3}$/.test(globalThis.location?.hostname || '')
const RELAY_URL = IS_LOCAL ? '/gemini' : 'https://quizard-relay.quizard-app.workers.dev/gemini'
const HAS_RELAY = true
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const KEY_STORAGE = 'quizard.gemini.key'

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}

export function setApiKey(key) {
  try {
    key = (key || '').trim()
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch { /* storage unavailable — personal key stays off */ }
}

// AI is available through the built-in relay; a personal key works too.
export function hasApiKey() { return HAS_RELAY || !!getApiKey() }
export function hasRelay() { return HAS_RELAY }
export function getModelPool() { return [MODEL_LABEL] }

async function relayOnce({ prompt, images, json, maxOutputTokens, temperature }, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res
  try {
    res = await fetch(RELAY_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(getApiKey() ? { 'x-quizard-key': getApiKey() } : {})
      },
      body: JSON.stringify({ prompt, images, json, maxOutputTokens, temperature })
    })
  } catch (err) {
    throw new Error(err.name === 'AbortError' ? 'timeout' : 'network_error')
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    let msg = `relay_http_${res.status}`
    try { const b = await res.json(); msg = b?.error || b?.message || msg } catch { /* keep generic */ }
    throw new Error(msg)
  }
  const text = await res.text()
  if (!text) throw new Error('empty_response')
  return text
}

// One quiet retry for transient capacity errors ("high demand" 503 spikes) —
// they come in bursts, so a short pause often gets through. Timeouts and hard
// errors are not retried here.
async function relayRequest(opts, timeoutMs) {
  try {
    return await relayOnce(opts, timeoutMs)
  } catch (err) {
    const msg = String(err?.message || err || '')
    if (/high demand|relay_http_503|relay_http_429/i.test(msg)) {
      await new Promise(r => setTimeout(r, 6000))
      return relayOnce(opts, timeoutMs)
    }
    throw err
  }
}

async function directRequest({ prompt, images = [], json = true, maxOutputTokens, temperature }, timeoutMs) {
  const key = getApiKey()
  if (!key) throw new Error('no_key')
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
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res
  try {
    res = await fetch(`${GEMINI_ENDPOINT}/${MODEL_LABEL}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    throw new Error(err.name === 'AbortError' ? 'timeout' : 'network_error')
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    let msg = `gemini_http_${res.status}`
    try { const b = await res.json(); msg = b?.error?.message || msg } catch { /* keep generic */ }
    throw new Error(msg)
  }
  const data = await res.json().catch(() => null)
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ?? ''
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason
    throw new Error(reason ? `blocked_${reason}` : 'empty_response')
  }
  return text
}

// Relay first (rotating server keys); direct-with-personal-key as backup.
async function aiRequest(opts, timeoutMs) {
  // A saved personal key goes FIRST: its quota belongs to this user alone and
  // it calls Google directly, skipping the shared relay's bottlenecks. The
  // relay covers users without a key and serves as the key-holder's backup.
  if (getApiKey()) {
    try {
      return await directRequest(opts, timeoutMs)
    } catch (err) {
      if (!HAS_RELAY) throw err
      // personal key failed (quota/invalid) — the relay is the backup
    }
  }
  if (HAS_RELAY) return relayRequest(opts, timeoutMs)
  throw new Error('no_key')
}

export async function chatJSON(prompt, { maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 60000 } = {}) {
  return aiRequest({ prompt, json: true, maxOutputTokens, temperature }, timeoutMs)
}

export async function chatMultimodal(prompt, images = [], { maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 90000, json = true } = {}) {
  return aiRequest({ prompt, images, json, maxOutputTokens, temperature }, timeoutMs)
}

export async function testApiKey() {
  try {
    const text = await chatJSON('Reply with JSON {"ok":true} only', { maxOutputTokens: 256, temperature: 0.4, timeoutMs: 20000 })
    const ok = /ok"?\s*:\s*true/i.test(text)
    return { ok, working: ok ? 1 : 0, total: 1, model: MODEL_LABEL, message: ok ? '' : 'unexpected_response' }
  } catch (e) {
    const msg = String(e?.message || e)
    return {
      ok: false,
      message: msg === 'no_key' ? 'No key' : msg,
      working: 0,
      total: 1,
      model: MODEL_LABEL
    }
  }
}
