// GitHub Pages build: the site is served under the /quizard/ project subpath
// and has no server, so the AI/TTS relay functions are borrowed from the
// Netlify branch deploy (stable alias, CORS enabled). Run: npm run build:pages
import { spawnSync } from 'node:child_process'

const r = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    VITE_BASE: 'quizard/',
    VITE_API_BASE: 'https://live--quizard-67e6a203.netlify.app'
  }
})
process.exit(r.status ?? 1)
