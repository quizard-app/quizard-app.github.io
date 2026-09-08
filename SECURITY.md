# Security Policy

Quizard is offline-first: your documents, quizzes and study history live in
your browser's IndexedDB and never leave your device unless you explicitly use
an online feature. This document explains the security model and how to report
vulnerabilities.

## Supported versions

Only the latest deployment is supported:

- Web: https://quizard-app.github.io/
- Android APK: the latest release

## Data handling

| Data | Where it lives | When it leaves the device |
|---|---|---|
| Documents, extracted text | IndexedDB (local) | Never, by design |
| Quiz results, mistakes, SRS schedule | IndexedDB (local) | Never, by design |
| Shared quiz links | Compressed into the URL fragment | Only when you create/share a link |
| Encrypted backups | A file you export (PBKDF2-SHA256 210k + AES-GCM-256) | Only when you save/send the file |
| AI question writing / explanations | Direct browser → Google Gemini API | Only when you add your own Gemini key and use AI features; the document text excerpt needed for generation is sent to Google |
| Wizard voice (TTS) | On-device speech synthesis | Never |

Your Gemini API key (optional) is stored in `localStorage` on your device and
is transmitted only to `generativelanguage.googleapis.com` over HTTPS. The app
ships no secrets — there is no server component at all.

## Hardening in place

- **Content-Security-Policy**: `script-src 'self'` (no inline scripts, no
  third-party script origins), `connect-src` locked to the app itself plus
  `generativelanguage.googleapis.com`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'none'`. It ships as a `<meta>` tag
  (GitHub Pages cannot set HTTP headers).
- **No secrets in the client**: the repo has a pre-commit secret scanner;
  keystores and `.env` are gitignored. AI is bring-your-own-key — the app
  never contains, and never needs, a server-held credential.
- **Share links carry no server state**: shared quizzes are fully encoded in
  the link fragment (`#...`), which browsers do not send to any server.

## Known limitations

- GitHub Pages cannot set HTTP headers, so `frame-ancestors` /
  `X-Frame-Options` cannot be enforced there; the CSP meta tag covers the
  script/style/connect surface instead.
- The Gemini API key is visible to anything that can read your browser's
  local storage on this origin (e.g. malicious browser extensions) — the same
  trade-off as every client-side BYOK web app.

## Reporting a vulnerability

Please open a private security advisory or contact the maintainer directly —
do not open a public issue for anything exploitable.

Include: what you found, how to reproduce it, and the impact. You'll get an
acknowledgement within a week and a fix or mitigation plan for anything
confirmed. Credit is given in the release notes if you want it.
