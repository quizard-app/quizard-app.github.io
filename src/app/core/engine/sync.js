// Cloud sync via the relay's sync locker: the library is exported, encrypted
// with the student's own passphrase, and stored under a random sync code.
// The relay only ever holds ciphertext plus a passphrase verifier — it can
// neither read a library nor let someone else overwrite a claimed code.
//
// The code + passphrase pair IS the account (no email, no sign-up): lose both
// and the locker is unreachable, which the UI states plainly.
import { exportAll, importAll } from './storage.js'
import { encryptBackup, decryptBackup, syncVerifier } from './crypto-backup.js'

const IS_LOCAL = /^localhost$|^127(\.\d+){3}$/.test(globalThis.location?.hostname || '')
const SYNC_URL = IS_LOCAL ? '/sync' : 'https://quizard-relay.quizard-app.workers.dev/sync'
const AUTO_PUSH_MIN_MS = 10 * 60 * 1000

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateSyncCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const chars = [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length])
  return chars.slice(0, 4).join('') + '-' + chars.slice(4).join('')
}

/** Tidy free-typed codes: uppercase, strip separators, re-dash 8 chars. */
export function normalizeSyncCode(v) {
  const raw = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return raw.length === 8 ? raw.slice(0, 4) + '-' + raw.slice(4) : raw
}

function readStore(key) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}
function writeStore(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch { /* storage unavailable — sync stays off */ }
}

/** Sync config as stored on this device. The passphrase is kept locally so
 * quiet auto-push can encrypt new snapshots without re-prompting; it only
 * ever protects the server copy, which the device owner can already read. */
export function getSyncInfo() {
  const code = readStore('quizard.sync.code')
  const pass = readStore('quizard.sync.pass')
  const lastPush = Number(readStore('quizard.sync.lastPush')) || 0
  return { code, passphrase: pass, lastPush, on: !!(code && pass) }
}

export function turnOffSync() {
  writeStore('quizard.sync.code', '')
  writeStore('quizard.sync.pass', '')
  writeStore('quizard.sync.lastPush', '')
}

async function callSync(payload) {
  const res = await fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const code = String(data?.error || `http_${res.status}`)
    const err = new Error(friendlySyncError(code))
    err.code = code
    throw err
  }
  return data
}

function friendlySyncError(code) {
  if (/bad_code/.test(code)) return 'That code does not look right — check it and try again'
  if (/code_pass_mismatch/.test(code)) return 'That code is already claimed with a different password'
  if (/code_not_found/.test(code)) return 'No library found for that code — check it on the other device'
  if (/bad_pass/.test(code)) return 'Wrong password for that code'
  if (/blob_too_large/.test(code)) return 'This library has grown too large to sync — export a backup file instead'
  if (/rate_limited/.test(code)) return 'Too many sync attempts — wait a minute and try again'
  if (/sync_not_configured/.test(code)) return 'Sync is not available right now'
  return 'Sync failed — check your connection and try again'
}

/** Claim a code (new locker) and push the first snapshot. */
export async function activateSync(code, passphrase) {
  const normalized = normalizeSyncCode(code)
  if (!/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(normalized)) throw new Error('Code format error')
  return pushSync({ code: normalized, passphrase })
}

/** Encrypt + upload the current library under this code. */
export async function pushSync({ code, passphrase }) {
  const data = await exportAll()
  const blob = await encryptBackup(data, passphrase)
  const verifier = await syncVerifier(passphrase, code)
  const out = await callSync({
    op: 'push', code, verifier, blob,
    docs: Array.isArray(data.docs) ? data.docs.length : null
  })
  writeStore('quizard.sync.code', code)
  writeStore('quizard.sync.pass', passphrase)
  writeStore('quizard.sync.lastPush', String(Date.now()))
  return { updatedAt: out.updatedAt, docs: data.docs?.length ?? 0 }
}

/** Download + decrypt + merge the locker's snapshot into this device. */
export async function pullSync(code, passphrase) {
  const verifier = await syncVerifier(passphrase, code)
  const out = await callSync({ op: 'pull', code, verifier })
  const data = await decryptBackup(out.blob, passphrase)
  const merged = await importAll(data, 'merge')
  writeStore('quizard.sync.code', code)
  writeStore('quizard.sync.pass', passphrase)
  writeStore('quizard.sync.lastPush', String(Date.now()))
  return { docs: merged.docs ?? data.docs?.length ?? 0, updatedAt: out.updatedAt }
}

/** Quiet background push — used on page-hide and app events. Never throws. */
export async function maybeAutoPush() {
  const { code, passphrase, lastPush, on } = getSyncInfo()
  if (!on) return false
  if (Date.now() - lastPush < AUTO_PUSH_MIN_MS) return false
  try {
    await pushSync({ code, passphrase })
    return true
  } catch {
    return false
  }
}

/** Kill switch: re-seal the locker under a new passphrase (same code). The
 * request is authorized with the CURRENT password; the replacement takes
 * over immediately, so the old password stops working on every device. */
export async function changeSyncPassword(oldPass, newPass) {
  const code = readStore('quizard.sync.code')
  if (!code) throw new Error('Sync is not on')
  if (!newPass || newPass.length < 6) throw new Error('New password must be at least 6 characters')
  if (newPass === oldPass) throw new Error('The new password is the same as the current one')
  const data = await exportAll()
  const blob = await encryptBackup(data, newPass)
  const verifier = await syncVerifier(oldPass, code)
  const newVerifier = await syncVerifier(newPass, code)
  try {
    await callSync({ op: 'push', code, verifier, newVerifier, blob, docs: Array.isArray(data.docs) ? data.docs.length : null })
  } catch (err) {
    if (err?.code === 'code_pass_mismatch') throw new Error('Current password is wrong')
    throw err
  }
  writeStore('quizard.sync.pass', newPass)
  writeStore('quizard.sync.lastPush', String(Date.now()))
  return { updatedAt: new Date().toISOString() }
}
