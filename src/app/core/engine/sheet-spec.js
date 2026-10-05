// Single source of truth for the printable bubble-sheet geometry (PLAN.md
// Phase 3). The PDF exporter draws from these constants and the OMR scanner
// samples from them, so print and scan can never drift apart. Units are PDF
// points on a Letter page (612 x 792 pt).

export const SHEET = {
  W: 612, H: 792, M: 44,
  frameW: 368,
  frameY: 96,    // frame top — below the printed header lockup
  headerH: 26,   // frame height = rows * rowPitch(count) + headerH
  gridDy: 20,    // grid top inside the frame
  circleR: 7,
  bubbleGap: 13, // gap between circles
  // The A–D letter printed inside each circle. Its ink lands exactly where the
  // scanner samples, so it raises the ink floor of every bubble equally — the
  // BLANK and MULTI thresholds only survive because that floor stays small.
  // `letterR` is the worst-case ink radius (the synthetic scan test draws a
  // solid patch this size); `letterCap` is Helvetica's cap height, used to
  // centre the letter on the bubble.
  letterR: 1.5, letterCap: 4.7,
  // Fraction of circleR the scanner samples inside, so the label-ink budget
  // below can be reasoned about (and tested) without duplicating the number.
  scanRadiusFrac: 0.85,
  colPad: 20,    // frame edge -> column origin
  rowLabelPad: 43, // column origin -> left edge of the first bubble
  rowLabelGap: 7,  // right edge of the row number -> first bubble
  pitch: 22,     // max row pitch (shrinks for 50-item sheets, see rowPitch)
  letters: ['A', 'B', 'C', 'D'],
  // The four alignment squares the scanner's homography is built from. They
  // are parked in the page margins, outside the printed box, so the answer
  // area holds nothing but the grid and the QR.
  marker: 10, markerGap: 24,
  // QR clearance: the code must never touch the bubble columns or the marker
  // squares, or thresholding merges them into one blob (scan bug). It lives in
  // the frame's bottom band, under the right-hand column — the band is
  // reserved in frameRect so the columns always end above it.
  qrSize: 76, qrPadX: 28, qrPadY: 8,
  qrBand: 94, // bottom band = QR + its caption + clearance
}

// The frame is centered on the page — balanced margins like a proper OMR form.
export function frameX() {
  return Math.round((SHEET.W - SHEET.frameW) / 2)
}

// Row pitch shrinks for tall sheets so the frame, the write-in fields and a
// printable bottom margin always fit the page.
export function rowPitch(count) {
  const rows = bubbleSheetLayout(count).rows
  const bottomReserve = 76 // write-in fields + printer margin
  const avail = SHEET.H - bottomReserve - SHEET.frameY - SHEET.gridDy - SHEET.headerH - SHEET.qrBand
  return Math.min(SHEET.pitch, Math.floor((avail / rows) * 10) / 10)
}

export function bubbleSheetLayout(count) {
  const single = count <= 8
  const columns = single
    ? [{ start: 1, count }]
    : [
        { start: 1, count: Math.ceil(count / 2) },
        { start: Math.ceil(count / 2) + 1, count: Math.floor(count / 2) }
      ]
  return {
    single,
    columns,
    rows: Math.max(...columns.map(c => c.count)),
    letters: SHEET.letters
  }
}

export function frameRect(count) {
  const { rows } = bubbleSheetLayout(count)
  return { x: frameX(), y: SHEET.frameY, w: SHEET.frameW, h: Math.round(rows * rowPitch(count) + SHEET.headerH + SHEET.qrBand) }
}

// Top-left corners of the four alignment squares, in reading order
// TL, TR, BR, BL. They sit in the page margins, clear of the frame.
export function markerRects(count) {
  const f = frameRect(count)
  const m = SHEET.marker, g = SHEET.markerGap
  return [
    { x: f.x - g - m, y: f.y },
    { x: f.x + f.w + g, y: f.y },
    { x: f.x + f.w + g, y: f.y + f.h - m },
    { x: f.x - g - m, y: f.y + f.h - m },
  ]
}

// Marker centroids in reading order TL, TR, BR, BL — the scanner's four known
// PDF-space points for the homography.
export function markerCenters(count) {
  const c = SHEET.marker / 2
  return markerRects(count).map(r => ({ x: r.x + c, y: r.y + c }))
}

export function columnX(count, colIndex) {
  const f = frameRect(count)
  const { single } = bubbleSheetLayout(count)
  return f.x + SHEET.colPad + colIndex * ((f.w - SHEET.colPad * 2) / (single ? 1 : 2))
}

// Center of one answer bubble. item is 0-based, letter 0..3 (A–D).
export function bubbleCenter(count, item, letter) {
  const f = frameRect(count)
  const layout = bubbleSheetLayout(count)
  let col = 0
  let row = item
  for (const c of layout.columns) { if (row < c.count) break; row -= c.count; col++ }
  const x = columnX(count, col) + SHEET.rowLabelPad + letter * (SHEET.circleR * 2 + SHEET.bubbleGap) + SHEET.circleR
  const y = f.y + SHEET.gridDy + row * rowPitch(count)
  return { x, y }
}

// Right edge of a row's number label, so callers can right-align it just left
// of the first bubble.
export function rowLabelRight(count, colIndex) {
  return columnX(count, colIndex) + SHEET.rowLabelPad - SHEET.rowLabelGap
}

export function qrRect(count) {
  const f = frameRect(count)
  return {
    x: f.x + f.w - SHEET.qrPadX - SHEET.qrSize,
    y: f.y + f.h - SHEET.qrPadY - SHEET.qrSize,
    size: SHEET.qrSize,
  }
}