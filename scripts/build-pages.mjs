// GitHub Pages org-site build: the site lives at https://quizard-app.github.io/
// (repo quizard-app.github.io, served from the root), so the base stays at '/'.
// The AI/TTS relay URL comes from .env (VITE_API_BASE) — set by the relay
// deploy (`npm run relay:deploy` prints it). Run: npm run build:pages
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load .env (gitignored) without clobbering real environment variables.
try {
  for (const line of readFileSync(join(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env — fine */ }

const r = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    VITE_BASE: '/'
  }
})
process.exit(r.status ?? 1)
