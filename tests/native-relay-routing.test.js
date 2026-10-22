import { afterEach, describe, expect, it, vi } from 'vitest'

// gemini.js picks its relay URL at module load. Capacitor also serves the app
// from https://localhost, which previously looked like the dev server and sent
// native AI calls to a local /gemini path that does not exist in the APK.

const RELAY = 'https://quizard-relay.quizard-app.workers.dev/gemini'

function localStorageStub() {
  const map = new Map()
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
  }
}

async function loadGemini({ native, hostname = 'localhost' }) {
  vi.stubGlobal('localStorage', localStorageStub())
  vi.stubGlobal('location', { hostname })
  if (native) vi.stubGlobal('Capacitor', { isNativePlatform: () => true })
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => 'OK',
    json: async () => ({}),
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.resetModules()
  const mod = await import('../src/app/core/engine/gemini.js')
  return { mod, fetchMock }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('relay URL on the native shell', () => {
  it('native app served from https://localhost calls the production relay', async () => {
    const { mod, fetchMock } = await loadGemini({ native: true })
    await expect(mod.chatJSON('hello')).resolves.toBe('OK')
    expect(fetchMock.mock.calls[0][0]).toBe(RELAY)
  })

  it('browser dev on localhost still uses the same-origin proxy', async () => {
    const { mod, fetchMock } = await loadGemini({ native: false })
    await expect(mod.chatJSON('hello')).resolves.toBe('OK')
    expect(fetchMock.mock.calls[0][0]).toBe('/gemini')
  })
})
