// The app talks straight to Google's Generative Language API using the
// user's own free Gemini API key (aistudio.google.com/apikey). The key is
// stored only on this device and is sent nowhere except Google. No server
// sits in between — the whole app is static. Without a key, every AI feature
// degrades to the built-in non-AI generators (see quiz-ai.js `no_key` path).

export const MODEL_LABEL = 'gemini-3.5-flash-lite'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const KEY_STORAGE = 'quizard.gemini.key'

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}

export function setApiKey(key) {
  try {
    key = (key || '').trim()
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch { /* storage unavailable — AI stays off */ }
}

export function hasApiKey() { return !!getApiKey() }
export function getModelPool() { return [MODEL_LABEL] }

async function geminiRequest({ prompt, images = [], json = true, maxOutputTokens, temperature }, timeoutMs) {
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
    res = await fetch(`${ENDPOINT}/${MODEL_LABEL}:generateContent`, {
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
    throw new Error(res.status === 429 || res.status === 403 ? `${msg}` : msg)
  }
  const data = await res.json().catch(() => null)
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ?? ''
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason
    throw new Error(reason ? `blocked_${reason}` : 'empty_response')
  }
  return text
}

export async function chatJSON(prompt, { maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 60000 } = {}) {
  return geminiRequest({ prompt, json: true, maxOutputTokens, temperature }, timeoutMs)
}

export async function chatMultimodal(prompt, images = [], { maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 90000, json = true } = {}) {
  return geminiRequest({ prompt, images, json, maxOutputTokens, temperature }, timeoutMs)
}

export async function testApiKey() {
  if (!hasApiKey()) return { ok: false, message: 'no_key', working: 0, total: 1, model: MODEL_LABEL }
  try {
    const text = await chatJSON('Reply with JSON {"ok":true} only', { maxOutputTokens: 256, temperature: 0.4, timeoutMs: 20000 })
    const ok = /ok"?\s*:\s*true/i.test(text)
    return { ok, working: ok ? 1 : 0, total: 1, model: MODEL_LABEL, message: ok ? '' : 'unexpected_response' }
  } catch (e) {
    return { ok: false, message: String(e?.message || e), working: 0, total: 1, model: MODEL_LABEL }
  }
}
