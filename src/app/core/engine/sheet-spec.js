// Single source of truth for the printable bubble-sheet geometry (PLAN.md
// Phase 3). The PDF exporter draws from these constants and the OMR scanner
// samples from them, so print and scan can never drift apart. Units are PDF
// points on a Letter page (612 x 792 pt).

export const SHEET = {
  W: 612, H: 792, M: 40,
  frameX: 130, frameY: 92, frameW: 442,
  headerH: 46,   // frame height = rows * pitch + headerH
  gridDy: 26,    // grid top inside the frame
  circleR: 6.5,
  bubbleGap: 10, // gap between circles
  rowLabelPad: 26,
  pitch: 22,
  letters: ['A', 'B', 'C', 'D'],
  marker: 10, markerInset: 6,
  // QR clearance: the code must never touch the corner markers or the
  // bubble columns, or thresholding merges them into one blob (scan bug)
  qrSize: 72, qrInset: 100,
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
  return { x: SHEET.frameX, y: SHEET.frameY, w: SHEET.frameW, h: rows * SHEET.pitch + SHEET.headerH }
}

// Corner-marker centroids in reading order TL, TR, BR, BL — the scanner's
// four known PDF-space points for the homography.
export function markerCenters(count) {
  const f = frameRect(count)
  const c = SHEET.marker / 2
  const i = SHEET.markerInset
  return [
    { x: f.x + i + c, y: f.y + i + c },
    { x: f.x + f.w - i - c, y: f.y + i + c },
    { x: f.x + f.w - i - c, y: f.y + f.h - i - c },
    { x: f.x + i + c, y: f.y + f.h - i - c },
  ]
}

export function columnX(count, colIndex) {
  const f = frameRect(count)
  const { single } = bubbleSheetLayout(count)
  return f.x + 22 + colIndex * ((f.w - 40) / (single ? 1 : 2))
}

// Center of one answer bubble. item is 0-based, letter 0..3 (A–D).
export function bubbleCenter(count, item, letter) {
  const f = frameRect(count)
  const layout = bubbleSheetLayout(count)
  let col = 0
  let row = item
  for (const c of layout.columns) { if (row < c.count) break; row -= c.count; col++ }
  const x = columnX(count, col) + SHEET.rowLabelPad + letter * (SHEET.circleR * 2 + SHEET.bubbleGap) + SHEET.circleR
  const y = f.y + SHEET.gridDy + row * SHEET.pitch
  return { x, y }
}

export function qrRect(count) {
  const f = frameRect(count)
  return { x: f.x + f.w - SHEET.qrInset, y: f.y + f.h - SHEET.qrInset, size: SHEET.qrSize }
}
