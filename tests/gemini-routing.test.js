import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Routing tests for the REAL gemini.js + ai-providers.js (nothing mocked
// except fetch and localStorage): the personal key's provider decides whether
// the call goes to Google, an OpenAI-compatible endpoint, or Anthropic — and
// the shared relay always remains the backup.

import { chatJSON, setApiKey, getModelPool } from '../src/app/core/engine/gemini.js'
import { setAiConfig, getAiConfig } from '../src/app/core/engine/ai-providers.js'

const RELAY_URL = 'https://quizard-relay.quizard-app.workers.dev/gemini'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'

function localStorageStub() {
  const map = new Map()
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k)
  }
}

const okJson = d => ({ ok: true, status: 200, json: async () => d })
const okText = t => ({ ok: true, status: 200, text: async () => t, json: async () => ({}) })
const bad = (status, body) => ({ ok: false, status, text: async () => JSON.stringify(body), json: async () => body })

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageStub())
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('gemini.js provider routing', () => {
  it('gemini key calls Google directly (relay untouched)', async () => {
    setApiKey('AIza-k')
    setAiConfig({ provider: 'gemini' })
    fetch.mockResolvedValue(okJson({ candidates: [{ content: { parts: [{ text: 'DIRECT' }] } }] }))
    await expect(chatJSON('hi')).resolves.toBe('DIRECT')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(GEMINI_URL)
    expect(fetch.mock.calls[0][1].headers['x-goog-api-key']).toBe('AIza-k')
  })

  it('failed direct gemini call falls back to the relay, key attached', async () => {
    setApiKey('AIza-k')
    setAiConfig({ provider: 'gemini' })
    fetch.mockResolvedValueOnce(bad(500, {}))
      .mockResolvedValueOnce(okText('RELAY'))
    await expect(chatJSON('hi')).resolves.toBe('RELAY')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1][0]).toBe(RELAY_URL)
    expect(fetch.mock.calls[1][1].headers['x-quizard-key']).toBe('AIza-k')
  })

  it('openrouter key routes to the adapter and succeeds without touching the relay', async () => {
    setApiKey('sk-or-k')
    setAiConfig({ provider: 'openrouter' })
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: 'OR' } }] }))
    await expect(chatJSON('hi')).resolves.toBe('OR')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(fetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer sk-or-k')
  })

  it('failed openrouter call falls back to the relay WITHOUT the foreign key', async () => {
    setApiKey('sk-or-k')
    setAiConfig({ provider: 'openrouter' })
    fetch.mockResolvedValueOnce(bad(401, { error: { message: 'bad key' } }))
      .mockResolvedValueOnce(okText('RELAY2'))
    await expect(chatJSON('hi', { shape: 'array' })).resolves.toBe('RELAY2')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(fetch.mock.calls[1][0]).toBe(RELAY_URL)
    expect(fetch.mock.calls[1][1].headers['x-quizard-key']).toBeUndefined()
  })

  it('without a key only the relay is called', async () => {
    setApiKey('')
    fetch.mockResolvedValue(okText('RELAY3'))
    await expect(chatJSON('hi')).resolves.toBe('RELAY3')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(RELAY_URL)
  })

  it('getModelPool reports the active provider\u2019s model', () => {
    setAiConfig({ provider: 'groq' })
    expect(getModelPool()).toEqual(['llama-3.3-70b-versatile'])
    setAiConfig({ provider: 'gemini' })
    expect(getModelPool()).toEqual(['gemini-3.5-flash-lite'])
  })
})
