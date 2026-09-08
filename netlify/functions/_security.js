// Shared security policy for Quizard's relay functions.
// - Strict CORS allowlist: only the deployed frontends (GitHub Pages, the
//   Netlify site, local dev and the Capacitor WebView origin) may read
//   responses. Unknown origins get no CORS headers, so browsers block them.
// - Best-effort in-memory rate limiting per client IP.
// - Payload caps.

const ALLOWED_ORIGINS = new Set([
  'https://quizard-app.github.io',
  // legacy homes that redirect or still have open tabs
  'https://quizforge-app.github.io',
  'https://quizard-67e6a203.netlify.app',
  'https://live--quizard-67e6a203.netlify.app',
  // local dev servers + the Capacitor Android WebView origin
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'https://localhost'
])

export function isAllowedOrigin(origin) {
  return !origin || ALLOWED_ORIGINS.has(origin)
}

// No Origin header = same-origin request (or a non-browser client); respond
// without ACAO so browsers enforce the allowlist, servers still work.
export function corsHeaders(origin) {
  const base = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff'
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    base['Access-Control-Allow-Origin'] = origin
    base['Cross-Origin-Resource-Policy'] = 'cross-origin'
  }
  return base
}

export function clientIp(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  )
}

// Fixed-window counter, best-effort: Netlify lambdas may run on several
// instances, so this caps abuse per instance rather than globally.
const buckets = new Map()
export function rateLimit(ip, max = 40, windowMs = 60000) {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b || now > b.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
    }
    return true
  }
  if (b.count >= max) return false
  b.count++
  return true
}

export function tooLarge(request, limit = 2_000_000) {
  const len = Number(request.headers.get('content-length') || 0)
  return len > limit
}
