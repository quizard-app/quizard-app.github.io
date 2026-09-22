# AGENTS.md

Angular 22 + Ionic app: PDF/PPTX/DOCX → exam-style quizzes. Deployed to GitHub Pages; AI via Cloudflare Worker relay.

## Commands

- `npm run start` — dev server
- `npm run build` — typecheck + build (`ng build && copy404`); this is the verify step
- `npm test` — vitest (`tests/**/*.test.js` only)
- `npm run local` — static server on :4310 with `POST /gemini` → production relay

No lint/typecheck scripts, no CI.

## Gotchas

- Zoneless CD; root `App` uses `ChangeDetectionStrategy.Eager`. OnPush strands `ion-router-outlet` pages.
- Engines are plain JS in `src/app/core/engine/` imported as `.js` from TS.
- Localhost uses `/gemini` proxy (`scripts/local-dev-server.mjs`); elsewhere `gemini.js` hits the relay URL directly. Relay CORS allows a fixed localhost port list.
- BYOK key: localStorage `quizard.gemini.key` (`ByokService` / `setApiKey`).
- Relay deploy: `node scripts/deploy-relay.mjs` (no npm script).
- Tests that hit network must `vi.mock` `src/app/core/engine/gemini.js`; storage tests use `fake-indexeddb`.
- `legacy/` is the old vanilla app — ignore.
- README development section is stale (scripts like `dev`/`typecheck` do not exist).
