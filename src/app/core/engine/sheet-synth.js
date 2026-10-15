// Synthetic bubble-sheet renderer for the dev-only scan tester (the
// "Simulate scan" panel on the Checking page). It prints the exact
// sheet-spec.js geometry onto a canvas, then "photographs" it — rotation, desk
// background, sensor noise — so the result can be pushed through the real scan
// path (decodeQr → readSheet → scoreSheet) with no camera, printer or paper.
//
// The renderer is browser-only (canvas). The part worth testing — which circles
// a pretend student shaded — is `planSheet`, a pure seeded function below.

import qrModule from 'qrcode-generator'
import {
  SHEET, frameRect, markerRects, bubbleCenter, qrRect,
  bubbleSheetLayout, rowLabelRight, sheetQrPayload, qrCaption,
} from './sheet-spec.js'

// The condition presets the panel offers. Each is a set of scan-realistic
// defects: a phone photo is never a flatbed scan.
export const SCENARIOS = [
  { id: 'clean', label: 'Clean sheet', accuracy: 100, rotate: 0, noise: 0, pencil: false, blanks: 0, multis: 0 },
  { id: 'tilted', label: 'Tilted + noisy photo', accuracy: 90, rotate: 4, noise: 16, pencil: false, blanks: 0, multis: 0 },
  { id: 'pencil', label: 'Faint pencil', accuracy: 80, rotate: 2, noise: 8, pencil: true, blanks: 0, multis: 0 },
  { id: 'messy', label: 'Double-shaded + skipped', accuracy: 75, rotate: 3, noise: 10, pencil: false, blanks: 1, multis: 2 },
  // Noise is kept below what kills the QR on purpose. A sheet whose QR won't
  // decode dies early on "which quiz is this?", which is a less interesting
  // failure than the one this preset is here to show: the corner squares are
  // gone, so there is nothing to build the perspective correction from.
  { id: 'bad', label: 'Photo gone wrong', accuracy: 60, rotate: 9, noise: 18, pencil: true, blanks: 2, multis: 1, dropMarker: true },
]

export function scenarioById(id) {
  return SCENARIOS.find(s => s.id === id) || SCENARIOS[0]
}

// ── which circles the pretend student shaded ──

/**
 * Decide the answer pattern for one fake sheet. Seeded, so the same seed always
 * draws the same sheet and a demo is reproducible.
 *
 * @param {object} o
 * @param {number} o.itemCount rows on the sheet
 * @param {number[]|null} [o.key] per-item correct letter (0..3), null if unkeyed
 * @param {number} [o.accuracy] 0..1 share of rows answered correctly
 * @param {number} [o.blanks] rows left empty
 * @param {number} [o.multis] rows with a second bubble shaded (must resolve as MULTI)
 * @param {number} [o.seed]
 * @returns {{ answers: number[], blanks: number[], multi: [number, number][] }}
 *   `answers[i]` is the letter shaded in row i, or -1 for a blank row.
 */
export function planSheet({ itemCount, key = null, accuracy = 1, blanks = 0, multis = 0, seed = 1 }) {
  const rnd = mulberry32(seed)
  // an unkeyed quiz has no right answer to aim at, so shade at random
  const right = i => (typeof key?.[i] === 'number' ? key[i] : Math.floor(rnd() * 4))
  const wrong = i => (right(i) + 1 + Math.floor(rnd() * 3)) % 4

  const answers = []
  for (let i = 0; i < itemCount; i++) answers.push(rnd() < accuracy ? right(i) : wrong(i))

  // placed after the answer pass so a blank can never also be double-shaded,
  // and so the counts are honoured exactly on short sheets
  const blankRows = pickRows(itemCount, blanks, rnd, i => answers[i] >= 0)
  const multiRows = pickRows(itemCount, multis, rnd, i => answers[i] >= 0 && !blankRows.includes(i))
  const multi = multiRows.map(i => [i, (answers[i] + 1 + Math.floor(rnd() * 3)) % 4])
  for (const i of blankRows) answers[i] = -1

  return { answers, blanks: blankRows, multi }
}

// Fisher-Yates over the eligible rows, then take n.
function pickRows(count, n, rnd, eligible) {
  const pool = []
  for (let i = 0; i < count; i++) if (eligible(i)) pool.push(i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, Math.min(n, pool.length)))
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── rendering ──

// Matches the resolution the camera path downsamples to (`min(1, 1600/width)`
// in CheckingPage), so the tester puts the CV pipeline under the same load a
// real phone photo does.
const SCALE = 2.6;

/**
 * Render a fake photo of a filled bubble sheet.
 *
 * @param {object} o
 * @param {number} o.itemCount rows on the sheet
 * @param {string} o.quizId written into the QR (QZ1 payload)
 * @param {{ id: string, name: string }|null} [o.student] roster student → QZ2 payload
 * @param {{ answers: number[], multi: [number, number][] }} o.plan from planSheet
 * @param {number} [o.rotate] degrees the sheet sits rotated on the desk
 * @param {number} [o.noise] 0..255 peak sensor noise
 * @param {boolean} [o.pencil] dither the shading instead of filling solid
 * @param {boolean} [o.dropMarker] leave out the top-left alignment square
 * @param {number} [o.seed] reproduces a given sheet exactly, noise included
 * @returns {ImageData} RGBA straight off the canvas, ready for readSheet
 */
export function renderSyntheticSheet({ itemCount, quizId, student = null, plan, rotate = 0, noise = 0, pencil = false, dropMarker = false, seed = 1 }) {
  const s = SCALE
  const pw = Math.round(SHEET.W * s), ph = Math.round(SHEET.H * s)

  // 1. print the sheet, upright
  const page = makeCanvas(pw, ph)
  printSheet(page.ctx, s, { itemCount, quizId, student, plan, pencil, dropMarker })

  // 2. photograph it — rotate onto a larger canvas so no corner marker gets
  //    cropped away, then lay it on a desk and add sensor noise
  const rad = (rotate * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad))
  const cw = Math.ceil(pw * cos + ph * sin), ch = Math.ceil(pw * sin + ph * cos)
  const shot = makeCanvas(cw, ch)
  shot.ctx.fillStyle = '#e6e6e2'
  shot.ctx.fillRect(0, 0, cw, ch)
  shot.ctx.translate(cw / 2, ch / 2)
  shot.ctx.rotate(rad)
  shot.ctx.drawImage(page.canvas, -pw / 2, -ph / 2)
  shot.ctx.setTransform(1, 0, 0, 1, 0, 0)
  // Noise runs off its own stream so it can't correlate with which bubbles the
  // planner shaded. Seeded rather than Math.random so one seed always yields
  // one sheet — a scan that misreads is then reproducible instead of a ghost.
  if (noise) addNoise(shot.ctx, cw, ch, noise, mulberry32((seed * 2654435761) >>> 0))

  return shot.ctx.getImageData(0, 0, cw, ch)
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true }) }
}

// Draw the printable sheet in PDF-point space, scaled by `s`. Every coordinate
// comes from sheet-spec.js, the same source export.js prints from.
function printSheet(ctx, s, { itemCount, quizId, student, plan, pencil, dropMarker }) {
  const p = v => v * s
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SHEET.W * s, SHEET.H * s)

  const f = frameRect()
  ctx.strokeStyle = '#0b0820'
  ctx.lineWidth = p(1.8)
  ctx.strokeRect(p(f.x), p(f.y), p(f.w), p(f.h))

  // the four alignment squares — the scanner's only reference for the homography
  ctx.fillStyle = '#0b0820'
  markerRects(itemCount).forEach((m, i) => {
    if (dropMarker && i === 0) return
    ctx.fillRect(p(m.x), p(m.y), p(SHEET.marker), p(SHEET.marker))
  })

  // real QR, real payload — jsQR has to do genuine work here
  const qr = qrRect(itemCount)
  paintQr(ctx, s, qr, sheetQrPayload(quizId, student), student ? 'L' : 'M')

  // the name under the code, exactly as the PDF prints it, so the thumbnail on
  // the result screen looks like the sheet the teacher is holding
  if (student?.name) {
    const cap = qrCaption(itemCount)
    ctx.fillStyle = '#6b7280'
    ctx.font = `${p(7)}px Helvetica, Arial, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(
      [student.no != null ? '#' + student.no : '', student.name].filter(Boolean).join(' '),
      p(cap.right),
      p(cap.baseline),
    )
  }

  // bubble grid: numbered rows, four circled letters, exactly as the PDF prints
  ctx.textBaseline = 'alphabetic'
  let idx = 0
  bubbleSheetLayout(itemCount).columns.forEach((col, ci) => {
    for (let r = 0; r < col.count; r++, idx++) {
      const y = bubbleCenter(itemCount, idx, 0).y
      ctx.fillStyle = '#6b7280'
      ctx.font = `${p(7.5)}px Helvetica, Arial, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(String(col.start + r), p(rowLabelRight(itemCount, ci)), p(y + 2.6))
      for (let b = 0; b < SHEET.letters.length; b++) {
        const c = bubbleCenter(itemCount, idx, b)
        ctx.beginPath()
        ctx.arc(p(c.x), p(c.y), p(SHEET.circleR), 0, Math.PI * 2)
        ctx.strokeStyle = '#0b0820'
        ctx.lineWidth = p(1.1)
        ctx.stroke()
        // the printed letter sits exactly where the scanner samples for ink
        ctx.fillStyle = '#6b7280'
        ctx.font = `${p(6.5)}px Helvetica, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(SHEET.letters[b], p(c.x), p(c.y + SHEET.letterCap / 2))
      }
    }
  })

  // …and the student's pencil on top of it
  const pencilFill = pencil ? ditherFill(ctx) : '#0b0820'
  plan.answers.forEach((b, i) => { if (b >= 0) shade(ctx, s, itemCount, i, b, pencilFill) })
  plan.multi.forEach(([i, b]) => shade(ctx, s, itemCount, i, b, pencilFill))
}

function shade(ctx, s, itemCount, item, letter, fill) {
  const c = bubbleCenter(itemCount, item, letter)
  ctx.beginPath()
  ctx.arc(c.x * s, c.y * s, SHEET.circleR * 0.8 * s, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

// A spatially broken fill at partial strength. A uniform grey would threshold
// away to nothing — only a broken fill survives Bradley thresholding, which is
// exactly why a real pencil reads as FAINT rather than BLANK.
//
// Two things are tuned against measured readSheet() output, not guessed:
//
//   period  inkFraction() samples on a grid of step round(rPx/4) = 4 at our
//          render scale. A 2px checkerboard aliases against a step-4 grid — every
//          sample lands in the same phase and reads as solid. 7 is coprime with
//          4, so the samples walk every phase and measure the true density.
//
//   density The printed letter alone scores ~0.05-0.09, so pencil ink has to
//          clear BLANK (0.30) on its own. At 0.286 measured shaded bubbles land
//          near 0.44 — mid-band between BLANK (0.30) and the OK cutoff (0.55).
//          The old 0.40 measured 0.53-0.72 and straddled the cutoff, so most
//          pencils came back OK and only the luckiest read FAINT.
const DITHER_PERIOD = 7
const DITHER_DARK = 2 // per row → 2/7 ≈ 0.286

function ditherFill(ctx) {
  const tile = makeCanvas(DITHER_PERIOD, DITHER_PERIOD)
  tile.ctx.fillStyle = '#0b0820'
  // Stride by (2,3) so light cells never form a run wider than the sampling
  // step — a solid light band would read as a hole in the pencil stroke.
  for (let r = 0; r < DITHER_PERIOD; r++) {
    for (let c = 0; c < DITHER_PERIOD; c++) {
      if ((r * 2 + c * 3) % DITHER_PERIOD < DITHER_DARK) tile.ctx.fillRect(c, r, 1, 1)
    }
  }
  return ctx.createPattern(tile.canvas, 'repeat')
}

function paintQr(ctx, s, qr, text, level) {
  // qrcode-generator is CJS; esbuild interop gives us the factory
  const factory = qrModule.default || qrModule
  // jsQR decodes byte mode as UTF-8, so the latin-1 default encoder would make
  // student names silently undecodable (see export.js bubbleQr)
  if (factory.stringToBytesFuncs && factory.stringToBytesFuncs['UTF-8']) {
    factory.stringToBytes = factory.stringToBytesFuncs['UTF-8']
  }
  const code = factory(0, level)
  code.addData(text)
  code.make()
  const cells = code.getModuleCount()
  const cell = qr.size / cells
  ctx.fillStyle = '#0b0820'
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (code.isDark(r, c)) ctx.fillRect((qr.x + c * cell) * s, (qr.y + r * cell) * s, cell * s + 0.5, cell * s + 0.5)
    }
  }
}

function addNoise(ctx, w, h, amount, rnd) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount
    for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, d[i + c] + n))
  }
  ctx.putImageData(img, 0, 0)
}