// Gate for developer-only UI that must never reach the deployed build. The app
// ships as static files to GitHub Pages, so `location.hostname` is the whole
// test: `ng serve` and `npm run local` both answer on localhost, the Pages
// deployment does not.
export function isDevHost(): boolean {
  const h = typeof location === 'undefined' ? '' : location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '0.0.0.0' || h.endsWith('.localhost');
}