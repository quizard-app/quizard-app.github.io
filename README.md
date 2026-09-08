# Quizard — turn your documents into exams

**Quizard** (a.k.a. QuizForge) is an offline-first study app: drop in the PDFs, slides and notes your teacher sends, and it forges them into quizzes, flashcards and exam-ready reviewers. Built as a vanilla-JS Vite PWA and an Android app via Capacitor.

> The magic-wielding mascot is not just decoration — the whole app is themed around a wizard who "forges" your documents into quizzes.

## Features

- **Import** PDF, DOCX, PPTX, TXT and MD files — text, images and topics are extracted **locally on your device** (pdf.js, mammoth, JSZip). Nothing is uploaded.
- **Quizzes** — 7 question types (multiple choice, true/false, fill-the-blank, identification, matching, ordering, short answer) generated offline by a deterministic, seeded engine; optionally rewritten by AI for exam-style phrasing.
- **Exam prep wizard** — paste the teacher's announcement into a chat; the AI matches it against your library, tells you which files you already have and which to upload, then builds a multi-file practice quiz and a PDF handout. Falls back to offline keyword matching without internet.
- **Reviewer** — a study handout per document: overview, key terms & definitions, section notes and a self-test with reveal-answers. Read aloud in the "wizard voice" (Fish Audio online, on-device synthesis offline) with read-along highlighting. Long-press any paragraph to bank it into your review deck.
- **Spaced repetition** — mistakes, saved notes and flashcards feed an SM-2-style scheduler (`src/lib/srs.js`); a daily reminder shows your real due-card count with a "Review now" button on Android.
- **Multi-profile** — separate accounts with optional PIN; tutorial gating is per profile.
- **Backup** — plain JSON export, plus a **passphrase-encrypted backup** (PBKDF2 210k + AES-GCM) that's safe to store in your own Google Drive — no server, no account.
- **Share** — quizzes compress into a link/QR; recipients play without the app or any key.

## Offline-first, cloud-optional

Everything core — import, quiz generation, flashcards, SRS, reviewer, PDF export, encrypted backups — works with **zero internet**. Two features are optional and use the network when online: AI question polish and answer explanations. Both degrade gracefully to the built-in offline engines.

AI calls go **directly from your browser to Google's Gemini API** using your own free key (Settings → AI question writing). The key is stored only on your device and is sent nowhere except Google — there is no intermediate server.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run typecheck  # tsc --noEmit against src/lib/db-types.ts
npm run build      # PWA production build (service worker included)
```

### Gemini key (optional, BYOK)

Create a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and paste it into **Settings → AI question writing** in the app. Without a key, quizzes are still generated offline by the built-in engine.

## Android

```bash
npm run build:cap        # web bundle for Capacitor (share links open the web app)
npx cap sync android
cd android
JAVA_HOME="<jdk-17+" ./gradlew assembleRelease
```

- Release signing reads `android/keystore.properties` (**untracked**) or env vars — never commit keystores or passwords.
- `versionName` is derived from `package.json`; bump `versionCode` in `android/app/build.gradle` per release.
- Output: `android/app/build/outputs/apk/release/Quizard.apk`.

## Deployment

- **GitHub Pages** (the only hosted target): `npm run build:pages` (base `/`), push `dist/` to the `gh-pages` branch — repo: quizard-app/quizard-app.github.io → **https://quizard-app.github.io/**

## Project layout

```
src/lib/          core engines — quizgen, srs, storage (IndexedDB v9),
                  extract (pdf/docx/pptx), topics, exam, tts, export, crypto-backup
src/lib/llm/      direct Gemini client (BYOK) + prompts (quiz, explain, transcribe, exam chat)
src/ui/screens/   one module per screen (library, quiz, reviewer, exams, …)
src/styles/       design system + the "magic" animation layer
public/wizard/    mascot art + tutorial screenshots + narration MP3s
tests/            vitest: engines, storage flows, exam prep (fake-indexeddb)
```

## Security notes

- A pre-commit hook (`scripts/pre-commit-secret-scan.sh`) blocks committing credential patterns — install it with `cp scripts/pre-commit-secret-scan.sh .git/hooks/pre-commit`.
- Keystores, `.env` and `apikey.txt` are gitignored; signing credentials come from `android/keystore.properties` or env vars.
- The pre-existing Internet permission on Android is used only by the optional cloud features above.

## License

All rights reserved by the author.
