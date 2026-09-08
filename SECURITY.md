# Security Policy

Quizard is offline-first: your documents, quizzes and study history live in
your browser's IndexedDB and never leave your device unless you explicitly use
an online feature. This document explains the security model and how to report
vulnerabilities.

## Supported versions

Only the latest deployment is supported:

- Web: https://quizforge-app.github.io/quizard/
- Android APK: the latest release

## Data handling

| Data | Where it lives | When it leaves the device |
|---|---|---|
| Documents, extracted text | IndexedDB (local) | Never, by design |
| Quiz results, mistakes, SRS schedule | IndexedDB (local) | Never, by design |
| Shared quiz links | Compressed into the URL fragment | Only when you create/share a link |
| Encrypted backups | A file you export (PBKDF2-SHA256 210k + AES-GCM-256) | Only when you save/send the file |
| AI question writing / explanations | Netlify relay function → Gemini/GLM | Only when AI features are enabled; the document text excerpt needed for generation is sent to the relay |
| Wizard voice (TTS) | Netlify relay function → Fish Audio | Only the exact text being spoken |

The relay functions hold the provider API keys server-side; keys are never
shipped to the client.

## Hardening in place

- **Content-Security-Policy**: `script-src 'self'` (no inline scripts, no
  third-party script origins), locked `connect-src` to the app's own origins
  plus its relay host, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'none'`. On GitHub Pages it ships as a `<meta>` tag; on
  Netlify as a real HTTP header, together with `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS and COOP.
- **Relay API allowlist**: the Gemini/TTS functions only return CORS headers
  for the deployed app origins (and local dev / the Capacitor WebView).
  Unknown origins are rejected with `403`.
- **Rate limiting + payload caps**: per-IP fixed-window limits (best-effort)
  and request-size caps on both relay functions.
- **No secrets in the client**: API keys live in Netlify environment
  variables; the repo has a pre-commit secret scanner; keystores and `.env`
  are gitignored.
- **Share links carry no server state**: shared quizzes are fully encoded in
  the link fragment (`#...`), which browsers do not send to any server.

## Known limitations

- GitHub Pages cannot set HTTP headers, so `frame-ancestors` /
  `X-Frame-Options` cannot be enforced there; the CSP meta tag covers the
  script/style/connect surface instead. Netlify enforces the full header set.
- The relay rate limiter is per-instance (serverless), so it caps per-instance
  abuse rather than providing a global quota.

## Reporting a vulnerability

Please open a private security advisory or contact the maintainer directly —
do not open a public issue for anything exploitable.

Include: what you found, how to reproduce it, and the impact. You'll get an
acknowledgement within a week and a fix or mitigation plan for anything
confirmed. Credit is given in the release notes if you want it.
