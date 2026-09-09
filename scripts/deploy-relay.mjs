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
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
  return vars
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.quiet ? ['pipe', 'pipe', 'pipe'] : 'inherit', shell: process.platform === 'win32', input: opts.input })
  if (r.status !== 0) {
    if (opts.quiet) console.error(r.stderr?.toString() || r.stdout?.toString())
    console.error(`\n✗ ${cmd} ${args.join(' ')} failed (exit ${r.status})`)
    process.exit(r.status ?? 1)
  }
  return r
}

const env = readEnv()

console.log('▸ Deploying worker…')
run('npx', ['wrangler', 'deploy', '--config', 'relay/wrangler.toml'])

// Where did it land? wrangler prints the URL; derive it from the name and
// account subdomain via `wrangler subdomain` (or let the user read the output).
const sub = run('npx', ['wrangler', 'subdomain'], { quiet: true }).stdout.toString()
const subdomain = (sub.match(/workers\.dev[^"]*?subdomain[^"]*?"([^"]+)"/) || [])[1]
  || (sub.match(/^([a-z0-9-]+)/m) || [])[1]
  || ''

const secrets = [
  ['GEMINI_KEYS', env.GEMINI_KEYS],
  ['FISH_API_KEY', env.FISH_API_KEY],
  ['FISH_VOICE_ID', env.FISH_VOICE_ID]
]
for (const [name, value] of secrets) {
  if (!value) { console.log(`· ${name}: not set in .env — skipped`); continue }
  console.log(`▸ Uploading secret ${name}…`)
  run('npx', ['wrangler', 'secret', 'put', name, '--config', 'relay/wrangler.toml'], { input: value + '\n', quiet: true })
}

console.log('')
console.log('✓ Relay deployed.')
console.log(`  URL: https://quizard-relay.${subdomain || '<your-subdomain>'}.workers.dev`)
console.log('  Put it in .env as VITE_API_BASE=..., then: npm run build:pages')
