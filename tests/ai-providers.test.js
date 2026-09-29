import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  PROVIDERS, getAiConfig, setAiConfig, activeModel, providerLabel,
  callOpenAICompatible, callAnthropic
} from '../src/app/core/engine/ai-providers.js'

// Adapter contract tests — every provider path is exercised with a mocked
// fetch, so no real (paid or free) API key is ever needed to verify them.

function localStorageStub() {
  const map = new Map()
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k)
  }
}

const okJson = d => ({ ok: true, status: 200, json: async () => d })
const bad = (status, body) => ({ ok: false, status, json: async () => body })

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageStub())
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('provider config', () => {
  it('defaults to gemini with its stock model', () => {
    expect(getAiConfig()).toEqual({ provider: 'gemini', model: '', baseUrl: '' })
    expect(activeModel()).toBe('gemini-3.5-flash-lite')
    expect(providerLabel()).toBe('Gemini')
  })

  it('persists provider choice and resolves the provider default model', () => {
    setAiConfig({ provider: 'groq' })
    expect(getAiConfig().provider).toBe('groq')
    expect(activeModel()).toBe('llama-3.3-70b-versatile')
    expect(providerLabel()).toBe('Groq')
  })

  it('honours a model override', () => {
    setAiConfig({ provider: 'openrouter', model: 'qwen/qwen-2.5-72b' })
    expect(activeModel()).toBe('qwen/qwen-2.5-72b')
  })

  it('keeps a custom base url', () => {
    setAiConfig({ provider: 'custom', baseUrl: 'http://localhost:1234/v1', model: 'my-model' })
    expect(getAiConfig()).toEqual({ provider: 'custom', model: 'my-model', baseUrl: 'http://localhost:1234/v1' })
  })
})

describe('OpenAI-compatible adapter', () => {
  const groq = () => ({ provider: 'groq', model: '', baseUrl: '' })

  it('posts chat completions with bearer auth, json mode and the default model', async () => {
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: 'HELLO' } }] }))
    const out = await callOpenAICompatible(groq(), 'gsk_key', { prompt: 'P', maxOutputTokens: 123, temperature: 0.2, timeoutMs: 5000 })
    expect(out).toBe('HELLO')
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(init.headers['Authorization']).toBe('Bearer gsk_key')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('llama-3.3-70b-versatile')
    expect(body.max_tokens).toBe(123)
    expect(body.temperature).toBe(0.2)
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages[0].content).toBe('P')
  })

  it('skips json_object mode for array answers (same rule as the relay\u2019s Groq path)', async () => {
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: '[]' } }] }))
    await callOpenAICompatible(groq(), 'k', { prompt: 'P', shape: 'array' })
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.response_format).toBeUndefined()
  })

  it('sends images as data-url image_url parts', async () => {
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: 'seen' } }] }))
    await callOpenAICompatible(groq(), 'k', { prompt: 'P', images: [{ mimeType: 'image/png', data: 'AAA' }] })
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.messages[0].content).toEqual([
      { type: 'text', text: 'P' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AAA' } }
    ])
  })

  it('retries once without response_format when the model rejects json mode', async () => {
    fetch.mockResolvedValueOnce(bad(400, { error: { message: 'response_format is not supported by this model' } }))
      .mockResolvedValueOnce(okJson({ choices: [{ message: { content: 'X' } }] }))
    const out = await callOpenAICompatible(groq(), 'k', { prompt: 'P' })
    expect(out).toBe('X')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[1][1].body).response_format).toBeUndefined()
  })

  it('retries with max_completion_tokens when the model rejects max_tokens', async () => {
    fetch.mockResolvedValueOnce(bad(400, { error: { message: 'max_tokens is not supported by this model. Use max_completion_tokens instead.' } }))
      .mockResolvedValueOnce(okJson({ choices: [{ message: { content: 'Y' } }] }))
    const out = await callOpenAICompatible(groq(), 'k', { prompt: 'P', maxOutputTokens: 321 })
    expect(out).toBe('Y')
    const body = JSON.parse(fetch.mock.calls[1][1].body)
    expect(body.max_completion_tokens).toBe(321)
    expect(body.max_tokens).toBeUndefined()
  })

  it('maps auth errors into the classified vocabulary (401 → invalid_key downstream)', async () => {
    fetch.mockResolvedValue(bad(401, { error: { message: 'Incorrect API key provided' } }))
    await expect(callOpenAICompatible(groq(), 'bad', { prompt: 'P' }))
      .rejects.toThrow(/groq_http_401: Incorrect API key provided/)
  })

  it('maps empty content to empty_response', async () => {
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: '' } }] }))
    await expect(callOpenAICompatible(groq(), 'k', { prompt: 'P' })).rejects.toThrow('empty_response')
  })

  it('requires a base url and model for the custom provider', async () => {
    await expect(callOpenAICompatible({ provider: 'custom', model: '', baseUrl: '' }, 'k', { prompt: 'P' }))
      .rejects.toThrow('no_base_url')
    await expect(callOpenAICompatible({ provider: 'custom', model: '', baseUrl: 'http://localhost:1234/v1' }, 'k', { prompt: 'P' }))
      .rejects.toThrow('no_model')
  })

  it('identifies OpenRouter with the X-Title header and honours model overrides', async () => {
    fetch.mockResolvedValue(okJson({ choices: [{ message: { content: 'ok' } }] }))
    await callOpenAICompatible({ provider: 'openrouter', model: 'qwen/qwen-2.5-72b', baseUrl: '' }, 'sk-or-k', { prompt: 'P' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(init.headers['X-Title']).toBe('Quizard')
    expect(JSON.parse(init.body).model).toBe('qwen/qwen-2.5-72b')
  })
})

describe('Anthropic adapter', () => {
  const anthropic = () => ({ provider: 'anthropic', model: '', baseUrl: '' })

  it('posts messages with the browser-access header and no json mode', async () => {
    fetch.mockResolvedValue(okJson({ content: [{ type: 'text', text: 'ANS' }] }))
    const out = await callAnthropic(anthropic(), 'sk-ant-k', { prompt: 'P', maxOutputTokens: 777 })
    expect(out).toBe('ANS')
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('sk-ant-k')
    expect(init.headers['anthropic-version']).toBe('2023-06-01')
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('claude-3-5-haiku-latest')
    expect(body.max_tokens).toBe(777)
    expect(body.messages[0].content).toBe('P')
  })

  it('sends images as base64 source blocks before the text', async () => {
    fetch.mockResolvedValue(okJson({ content: [{ type: 'text', text: 'x' }] }))
    await callAnthropic(anthropic(), 'k', { prompt: 'P', images: [{ mimeType: 'image/jpeg', data: 'BBB' }] })
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.messages[0].content).toEqual([
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'BBB' } },
      { type: 'text', text: 'P' }
    ])
  })

  it('maps a max_tokens stop with no text to blocked_max_tokens', async () => {
    fetch.mockResolvedValue(okJson({ stop_reason: 'max_tokens', content: [] }))
    await expect(callAnthropic(anthropic(), 'k', { prompt: 'P' })).rejects.toThrow('blocked_max_tokens')
  })

  it('maps auth errors into the classified vocabulary', async () => {
    fetch.mockResolvedValue(bad(401, { error: { message: 'invalid x-api-key' } }))
    await expect(callAnthropic(anthropic(), 'bad', { prompt: 'P' }))
      .rejects.toThrow(/anthropic_http_401: invalid x-api-key/)
  })
})
