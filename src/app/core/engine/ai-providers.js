// Personal-key provider registry + request adapters for "bring your own key".
// Gemini stays the default (its direct-Google path lives in gemini.js); every
// other provider funnels through one of two adapters below. Both mirror the
// gemini.js internal contract: return the model's text reply, throw Error with
// one of the classified message strings the app already maps everywhere
// (classifyAIError, the reviewer's RelayUnavailableError, ByokService's
// skip-list) — timeout, network_error, *_http_<status>, blocked_*, empty_response.

const CONFIG_STORAGE = 'quizard.ai.config'

export const PROVIDERS = {
  gemini: {
    id: 'gemini', label: 'Gemini', adapter: 'gemini',
    keyUrl: 'https://aistudio.google.com/apikey', keyPage: 'Google AI Studio',
    keyHint: 'AIza…', model: 'gemini-3.5-flash-lite', free: true, vision: true
  },
  openrouter: {
    id: 'openrouter', label: 'OpenRouter', adapter: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1', keyUrl: 'https://openrouter.ai/keys', keyPage: 'openrouter.ai',
    keyHint: 'sk-or-…', model: 'meta-llama/llama-3.3-70b-instruct:free', free: true, vision: true
  },
  groq: {
    id: 'groq', label: 'Groq', adapter: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1', keyUrl: 'https://console.groq.com/keys', keyPage: 'console.groq.com',
    keyHint: 'gsk_…', model: 'llama-3.3-70b-versatile', free: true, vision: false
  },
  openai: {
    id: 'openai', label: 'OpenAI', adapter: 'openai',
    baseUrl: 'https://api.openai.com/v1', keyUrl: 'https://platform.openai.com/api-keys', keyPage: 'platform.openai.com',
    keyHint: 'sk-…', model: 'gpt-4o-mini', free: false, vision: true
  },
  anthropic: {
    id: 'anthropic', label: 'Claude', adapter: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1', keyUrl: 'https://console.anthropic.com/settings/keys', keyPage: 'console.anthropic.com',
    keyHint: 'sk-ant-…', model: 'claude-3-5-haiku-latest', free: false, vision: true
  },
  custom: {
    id: 'custom', label: 'Custom', adapter: 'openai',
    baseUrl: '', keyUrl: '', keyPage: 'your provider',
    keyHint: 'any OpenAI-compatible key', model: '', free: false, vision: true
  }
}

export function getAiConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_STORAGE) || '{}')
    const provider = PROVIDERS[raw.provider] ? raw.provider : 'gemini'
    return { provider, model: String(raw.model || ''), baseUrl: String(raw.baseUrl || '') }
  } catch { return { provider: 'gemini', model: '', baseUrl: '' } }
}

export function setAiConfig(patch) {
  const next = { ...getAiConfig(), ...(patch || {}) }
  try {
    if (next.provider === 'gemini' && !next.model && !next.baseUrl) localStorage.removeItem(CONFIG_STORAGE)
    else localStorage.setItem(CONFIG_STORAGE, JSON.stringify(next))
  } catch { /* storage unavailable — provider choice stays default */ }
  return next
}

// The model actually used for the configured provider: the user's override or
// the provider's default. '' means unconfigured (custom without a model).
export function activeModel(cfg = getAiConfig()) {
  const p = PROVIDERS[cfg.provider] || PROVIDERS.gemini
  return (cfg.model || p.model || '').trim()
}

export function providerLabel(cfg = getAiConfig()) {
  return (PROVIDERS[cfg.provider] || PROVIDERS.gemini).label
}

function joinUrl(base, path) {
  return (base || '').replace(/\/+$/, '') + path
}

// Shared fetch wrapper: per-attempt AbortController timeout, abort → 'timeout',
// network failure → 'network_error', non-OK → '<tag>_http_<status>: <server
// message>' so classifyAIError keeps mapping 401/403 → invalid_key,
// 429/rate/quota → quota, 50x/overloaded → server_busy.
async function httpJson(url, { headers, body, timeoutMs, tag }) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res
  try {
    res = await fetch(url, { method: 'POST', signal: ctrl.signal, headers, body: JSON.stringify(body) })
  } catch (err) {
    throw new Error(err.name === 'AbortError' ? 'timeout' : 'network_error')
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    let detail = ''
    try {
      const b = await res.json()
      detail = b?.error?.message || b?.error || b?.message || ''
      if (typeof detail !== 'string') detail = ''
    } catch { /* keep generic */ }
    throw new Error(`${tag}_http_${res.status}${detail ? ': ' + detail : ''}`)
  }
  return res.json().catch(() => null)
}

// OpenAI-compatible chat completions — one adapter covers OpenRouter, Groq,
// OpenAI, DeepSeek, Mistral, LM Studio/Ollama and friends. Mirrors the relay's
// proven Groq rules: Gemini's responseSchema is not supported (the prompts
// already describe the JSON), and array answers skip json_object mode because
// it forces an object at the top level.
export async function callOpenAICompatible(cfg, key, { prompt, images = [], json = true, maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 60000, shape = 'object' }) {
  if (!key) throw new Error('no_key')
  const p = PROVIDERS[cfg.provider] || {}
  const baseUrl = (cfg.provider === 'custom' ? cfg.baseUrl : p.baseUrl || '').trim()
  if (!baseUrl) throw new Error('no_base_url')
  const model = activeModel(cfg)
  if (!model) throw new Error('no_model')

  const content = images.length
    ? [
        { type: 'text', text: prompt },
        ...images.filter(im => im?.data && im?.mimeType).map(im => ({ type: 'image_url', image_url: { url: `data:${im.mimeType};base64,${im.data}` } }))
      ]
    : prompt
  const messages = [{ role: 'user', content }]

  const call = (jsonMode, tokenParam) => httpJson(joinUrl(baseUrl, '/chat/completions'), {
    timeoutMs, tag: cfg.provider,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      ...(cfg.provider === 'openrouter' ? { 'X-Title': 'Quizard' } : {})
    },
    body: {
      model, messages, temperature,
      [tokenParam]: maxOutputTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    }
  })

  // Newer OpenAI reasoning models want max_completion_tokens instead of
  // max_tokens; open-source models vary on json mode. One quiet retry covers
  // each rejection; anything else surfaces as-is.
  let data
  try {
    data = await call(json && shape !== 'array', 'max_tokens')
  } catch (err) {
    const msg = String(err?.message || err || '')
    if (/_http_400/.test(msg) && /max_completion_tokens/i.test(msg)) {
      data = await call(json && shape !== 'array', 'max_completion_tokens')
    } else if (/_http_400/.test(msg) && /json|response_format/i.test(msg)) {
      data = await call(false, 'max_tokens')
    } else {
      throw err
    }
  }

  const text = data?.choices?.[0]?.message?.content ?? ''
  if (!text) {
    const reason = data?.choices?.[0]?.finish_reason
    throw new Error(reason === 'content_filter' ? 'blocked_content_filter' : 'empty_response')
  }
  return typeof text === 'string' ? text : JSON.stringify(text)
}

// Anthropic messages API — no native JSON mode (the prompts already demand
// JSON), and browser calls need Anthropic's documented opt-in header for CORS.
export async function callAnthropic(cfg, key, { prompt, images = [], maxOutputTokens = 2048, temperature = 0.4, timeoutMs = 60000 }) {
  if (!key) throw new Error('no_key')
  const p = PROVIDERS[cfg.provider] || {}
  const baseUrl = (p.baseUrl || '').trim()
  const model = activeModel(cfg)
  if (!model) throw new Error('no_model')

  const content = images.length
    ? [
        ...images.filter(im => im?.data && im?.mimeType).map(im => ({ type: 'image', source: { type: 'base64', media_type: im.mimeType, data: im.data } })),
        { type: 'text', text: prompt }
      ]
    : prompt

  const data = await httpJson(joinUrl(baseUrl, '/messages'), {
    timeoutMs, tag: 'anthropic',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: { model, max_tokens: maxOutputTokens, temperature, messages: [{ role: 'user', content }] }
  })

  const text = data?.content?.map(b => b?.text || '').join('') ?? ''
  if (!text) {
    const reason = data?.stop_reason
    throw new Error(reason && reason !== 'end_turn' ? `blocked_${reason}` : 'empty_response')
  }
  return text
}
