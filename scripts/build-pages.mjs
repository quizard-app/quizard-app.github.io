// GitHub Pages org-site build: the site lives at https://quizard-app.github.io/
// (repo quizard-app.github.io, served from the root), so the base stays at '/'.
// The AI/TTS relay functions are borrowed from the Netlify branch deploy.
// Run: npm run build:pages
import { spawnSync } from 'node:child_process'

const r = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    VITE_BASE: '/',
    VITE_API_BASE: 'https://live--quizard-67e6a203.netlify.app'
  }
})
process.exit(r.status ?? 1)
