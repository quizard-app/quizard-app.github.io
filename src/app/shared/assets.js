// Resolve asset paths against the document base so they work at the server
// root, under GitHub Pages subpaths and inside Capacitor alike.
export function assetUrl(path) {
  if (/^(https?:|data:|blob:|capacitor:)/i.test(path)) return path
  const base = (typeof document !== 'undefined' && document.baseURI) || '/'
  const prefix = base.endsWith('/') ? base : base + '/'
  const clean = path.startsWith('/') ? path.slice(1) : path
  return prefix + clean
}
