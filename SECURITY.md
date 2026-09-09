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
| AI question writing / explanations | Built-in relay (Cloudflare Worker) → Gemini | Only when AI features are enabled; the document text excerpt needed for generation is sent to the relay and Google |
| Wizard voice (TTS) | Built-in relay (Cloudflare Worker) → Fish Audio | Only the exact text being spoken |

The relay worker holds the provider API keys as Cloudflare secrets; keys are
never shipped to the client. Optionally a user may save a personal Gemini key
in Settings — it is stored in the device's `localStorage` and used only as a
fallback when every relay key is throttled (or when no relay is configured).

## Hardening in place

- **Content-Security-Policy**: `script-src 'self'` (no inline scripts, no
  third-party script origins), `connect-src` locked to the app itself, its
  relay origin, and `generativelanguage.googleapis.com` (personal-key
  fallback), plus `object-src 'none'`, `base-uri 'self'`,
  `form-action 'none'`. It ships as a `<meta>` tag (GitHub Pages cannot set
  HTTP headers).
- **Relay origin allowlist**: the worker only returns CORS headers for the
  deployed app origin (plus local dev / the Capacitor WebView). Unknown
  origins are rejected with `403`.
- **Relay rate limiting + payload caps**: per-IP fixed-window limits
  (best-effort, per isolate) and request-size caps on both routes.
- **No secrets in the client**: provider keys live in Cloudflare secrets;
  the repo has a pre-commit secret scanner; keystores and `.env` are
  gitignored.
- **Share links carry no server state**: shared quizzes are fully encoded in
  the link fragment (`#...`), which browsers do not send to any server.

## Known limitations

- GitHub Pages cannot set HTTP headers, so `frame-ancestors` /
  `X-Frame-Options` cannot be enforced there; the CSP meta tag covers the
  script/style/connect surface instead.
- The relay rate limiter is per-isolate, so it caps per-isolate abuse rather
  than providing a global quota.
- A personal Gemini key saved in Settings is visible to anything that can
  read the site's local storage on this device (e.g. malicious browser
  extensions) — the standard trade-off of client-side keys.

## Reporting a vulnerability

Please open a private security advisory or contact the maintainer directly —
do not open a public issue for anything exploitable.

Include: what you found, how to reproduce it, and the impact. You'll get an
acknowledgement within a week and a fix or mitigation plan for anything
confirmed. Credit is given in the release notes if you want it.
