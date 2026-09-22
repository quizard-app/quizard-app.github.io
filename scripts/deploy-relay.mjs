// Deploy the relay worker (relay/) to Cloudflare and push the provider keys
// from the local gitignored .env as worker secrets.
//
//   npm run relay:deploy
//
// First run requires `npx wrangler login` (opens a browser). Afterwards this
// prints the worker URL — put it in .env as VITE_API_BASE and rebuild:
//   npm run build:pages && npm run deploy:pages
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function readEnv() {
  const path = join(process.cwd(), '.env')
  const vars = {}
  if (existsSync(path)) {
    // [^\r\n] not `.` — JS dots don't match \r, and values can embed CRs.
    // A line that is not KEY=value (and not blank/comment) continues the
    // previous value, so GEMINI_KEYS can list one key per line.
    let lastKey = null
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*([^\r\n]*)/)
      if (m) {
        vars[m[1]] = m[2].replace(/\r/g, '').replace(/^["']|["']$/g, '').trim()
        lastKey = m[1]
        continue
      }
      const cont = line.trim()
      if (cont && !cont.startsWith('#') && lastKey) vars[lastKey] += '\n' + cont
    }
  }
  return vars
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.quiet ? ['pipe', 'pipe', 'pipe'] : 'inherit', shell: process.platform === 'win32', input: opts.input })
  if (r.status !== 0 && opts.fatal !== false) {
    if (opts.quiet) console.error(r.stderr?.toString() || r.stdout?.toString())
    console.error(`\n✗ ${cmd} ${args.join(' ')} failed (exit ${r.status})`)
    process.exit(r.status ?? 1)
  }
  return r
}

const env = readEnv()

console.log('▸ Deploying worker…')
const deployed = run('npx', ['wrangler', 'deploy', '--config', 'relay/wrangler.toml'], { quiet: true })
const deployedUrl = (deployed.stdout.toString().match(/https:\/\/\S+\.workers\.dev/) || [])[0] || ''

// Legacy fallback: parse the account subdomain if the deploy URL wasn't printed.
const sub = deployedUrl ? '' : (run('npx', ['wrangler', 'subdomain'], { quiet: true, fatal: false }).stdout?.toString() || '')
const subdomain = (sub.match(/workers\.dev[^"]*?subdomain[^"]*?"([^"]+)"/) || [])[1]
  || (sub.match(/^([a-z0-9-]+)/m) || [])[1]
  || ''

const secrets = [
  ['GEMINI_KEYS', env.GEMINI_KEYS],
  ['GROQ_API_KEY', env.GROQ_API_KEY],
  ['FISH_API_KEY', env.FISH_API_KEY],
  ['FISH_VOICE_ID', env.FISH_VOICE_ID]
]

// Gemini keys look like AIza… — catch placeholders/truncated pastes here,
// because one bad key used to poison the whole rotation pool.
if (env.GEMINI_KEYS) {
  const entries = env.GEMINI_KEYS.replace(/^["']|["']$/g, '').split(/[\n\r,]+/).map(k => k.trim()).filter(Boolean)
  console.log(`▸ GEMINI_KEYS: ${entries.length} key${entries.length === 1 ? '' : 's'} to rotate`)
  entries.forEach((k, i) => {
    if (!/^(AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,})$/.test(k)) {
      console.log(`  ⚠ line ${i + 1} does not look like a Gemini key (expected AIza… or AQ.…): "${k.slice(0, 12)}…" — fix or remove it before relying on the pool`)
    }
  })
}
// Groq keys look like gsk_… — same placeholder check as the Gemini pool.
if (env.GROQ_API_KEY) {
  const entries = env.GROQ_API_KEY.replace(/^["']|["']$/g, '').split(/[\n\r,]+/).map(k => k.trim()).filter(Boolean)
  console.log(`▸ GROQ_API_KEY: ${entries.length} key${entries.length === 1 ? '' : 's'} to rotate`)
  entries.forEach((k, i) => {
    if (!/^gsk_[0-9A-Za-z]{20,}$/.test(k)) {
      console.log(`  ⚠ key ${i + 1} does not look like a Groq key (expected gsk_…): "${k.slice(0, 8)}…" — fix or remove it before relying on the fallback`)
    }
  })
}
for (const [name, value] of secrets) {
  if (!value) { console.log(`· ${name}: not set in .env — skipped`); continue }
  console.log(`▸ Uploading secret ${name}…`)
  run('npx', ['wrangler', 'secret', 'put', name, '--config', 'relay/wrangler.toml'], { input: value + '\n', quiet: true })
}

console.log('')
console.log('✓ Relay deployed.')
console.log(`  URL: ${deployedUrl || `https://quizard-relay.${sub || '<your-subdomain>'}.workers.dev`}`)
console.log('  Put it in .env as VITE_API_BASE=..., then: npm run build:pages')
