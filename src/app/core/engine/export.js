import qrModule from 'qrcode-generator'
import { SHEET, bubbleSheetLayout, frameRect, markerCenters, columnX, qrRect, idDigitCenter, rowPitch } from './sheet-spec.js'

export { bubbleSheetLayout } from './sheet-spec.js'

function download(filename, content, mime = 'text/markdown') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function slug(name) {
  return String(name || 'doc').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'doc'
}

function pdfSafe(s) {
  return String(s || '')
    .replace(/→/g, ' -> ')
    // arrows, dingbats, emoji and variation selectors that the standard PDF
    // fonts cannot render (→ is converted, the rest are dropped)
    .replace(/[\u2190-\u21FF\u2300-\u27BF\uFE0F]|[\uD800-\uDFFF]/g, '')
}

export async function exportClassReportPdf(cls, quiz, sheets, analysis) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = 612, H = 792, M = 48
  let y = 0
  const need = h => { if (y + h > H - M) { pdf.addPage(); y = M } }
  const text = (str, { size = 11, bold = false, color = '#1c2438', gap = 4, indent = 0 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(color)
    const lines = pdf.splitTextToSize(pdfSafe(str), W - M * 2 - indent)
    need(lines.length * (size + 3))
    lines.forEach(line => { pdf.text(line, M + indent, y + size); y += size + 3 })
    y += gap
  }

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('Q U I Z A R D   ·   C L A S S   R E S U L T S', M, M + 6)
  y = M + 24
  text(cls.name, { size: 18, bold: true, gap: 2 })
  text(`${quiz.subject}${quiz.title ? ' — ' + quiz.title : ''} · ${sheets.length} sheet${sheets.length === 1 ? '' : 's'} checked`, { size: 10.5, color: '#6b7280', gap: 12 })

  text('Scores', { size: 13, bold: true, gap: 6 })
  const avg = Math.round(sheets.reduce((s, x) => s + x.percent, 0) / (sheets.length || 1))
  text(`Class average: ${avg}%`, { size: 10.5, color: '#6b7280', gap: 8 })
  for (const s of sheets) {
    need(22)
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5); pdf.setTextColor('#1c2438')
    pdf.text(pdfSafe(s.studentName), M + 6, y + 10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${s.correct}/${s.total}`, W - M - 90, y + 10)
    pdf.text(`${s.percent}%`, W - M - 34, y + 10)
    y += 16
  }

  y += 10
  text('Item analysis — questions the class missed most', { size: 13, bold: true, gap: 8 })
  const barW = W - M * 2 - 150
  for (const r of analysis) {
    need(24)
    const q = r.question.length > 42 ? r.question.slice(0, 42) + '…' : r.question
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor('#1c2438')
    pdf.text(`Q${r.n}`, M + 4, y + 9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(pdfSafe(q || `Question ${r.n}`), M + 28, y + 9)
    pdf.setTextColor('#6b7280')
    pdf.text(`${r.missRate}% of ${r.attempted}`, W - M - 96, y + 9)
    pdf.setFillColor('#e9e6f7'); pdf.rect(M + 28, y + 13, barW, 5, 'F')
    pdf.setFillColor('#7c3aed'); pdf.rect(M + 28, y + 13, barW * r.missRate / 100, 5, 'F')
    y += 22
  }
  if (!analysis.some(r => r.attempted)) text('No attempts recorded yet.', { size: 10, color: '#6b7280' })

  pdf.save(`quizard-results-${slug(cls.name)}.pdf`)
}

// ── Teacher app exports (PLAN.md Phase 2): quiz paper, teacher key, bubble sheets ──
// Geometry lives in sheet-spec.js — the Phase 3 scanner samples the same
// constants, so the printed sheet and the scanner agree by construction.

function bubbleQr(pdf, text, x, y, size) {
  // qrcode-generator is CJS; esbuild interop gives us the factory
  const qrFactory = qrModule.default || qrModule
  const qr = qrFactory(0, 'M')
  qr.addData(text)
  qr.make()
  const cells = qr.getModuleCount()
  const cell = size / cells
  pdf.setFillColor('#0b0820')
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (qr.isDark(r, c)) pdf.rect(x + c * cell, y + r * cell, cell + 0.2, cell + 0.2, 'F')
    }
  }
}

function headerBlock(pdf, quiz, subtitle) {
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('Q U I Z A R D', SHEET.M, SHEET.M + 6)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor('#1c2438')
  const title = pdfSafe(quiz.subject + (quiz.title ? ' — ' + quiz.title : ''))
  pdf.text(title, SHEET.M, SHEET.M + 26)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor('#6b7280')
  pdf.text(pdfSafe(subtitle), SHEET.M, SHEET.M + 40)
}

// Shared scaffold for the quiz paper and the teacher's key copy.
export async function buildTeacherQuizPdf(quiz, { withAnswers = false } = {}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = 612, H = 792, M = 48
  let y = 0
  const need = h => { if (y + h > H - M) { pdf.addPage(); y = M } }
  const text = (str, { size = 11, bold = false, color = '#1c2438', gap = 4, indent = 0 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(color)
    const lines = pdf.splitTextToSize(pdfSafe(str), W - M * 2 - indent)
    need(lines.length * (size + 3))
    lines.forEach(line => { pdf.text(line, M + indent, y + size); y += size + 3 })
    y += gap
  }

  headerBlock(pdf, quiz, withAnswers
    ? 'Teacher copy — correct answers marked'
    : 'Student name: ________________    Date: ____________    Grade & Section: ____________')
  y = M + 56
  text('Directions: Read each question. Shade the letter of the best answer on the answer sheet.', { size: 9.5, color: '#6b7280', gap: 10 })

  quiz.items.forEach((it, i) => {
    need(60)
    text(`${i + 1}. ${it.question}`, { bold: false, gap: 3 })
    it.options.forEach((o, oi) => {
      const correct = withAnswers && oi === it.answerIndex
      text(`${'ABCD'[oi]}. ${o}${correct ? '   (ANSWER)' : ''}`, { size: 10.5, indent: 16, bold: correct, color: correct ? '#166534' : '#1c2438', gap: 1 })
    })
    if (withAnswers) text('', { size: 4, gap: 2 })
  })

  return pdf
}

export async function exportTeacherQuizPdf(quiz, { withAnswers = false } = {}) {
  const pdf = await buildTeacherQuizPdf(quiz, { withAnswers })
  pdf.save(`quizard-${withAnswers ? 'key' : 'quiz'}-${slug(quiz.subject || quiz.title)}.pdf`)
}

// The scannable answer sheet: frame, corner markers, QR (quiz id), two-column
// A–D bubble grid, and the write-in fields the teacher asked for.
/**
 * @typedef {'letter' | 'a4' | 'long'} PaperSize
 */
const PAPER = { letter: [612, 792], a4: [595, 842], long: [612, 936] }

// Builds the bubble-sheet document (preview renders this; export saves it).
export async function buildBubbleSheetsPdf(quiz, copies = 1, size = 'letter') {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: PAPER[size] || PAPER.letter })

  for (let copy = 0; copy < Math.max(1, Math.min(60, copies)); copy++) {
    if (copy > 0) pdf.addPage()

    headerBlock(pdf, quiz, 'Shade ONE answer circle per row + your student number, fully.')

    // frame + corner markers (geometry from sheet-spec.js)
    const f = frameRect(quiz.items.length)
    pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1.6)
    pdf.rect(f.x, f.y, f.w, f.h, 'S')
    pdf.setFillColor('#0b0820')
    const mk = SHEET.marker, inset = SHEET.markerInset
    for (const [cx, cy] of [[f.x + inset, f.y + inset], [f.x + f.w - inset - mk, f.y + inset], [f.x + inset, f.y + f.h - inset - mk], [f.x + f.w - inset - mk, f.y + f.h - inset - mk]]) {
      pdf.rect(cx, cy, mk, mk, 'F')
    }

    // QR (identifies the quiz/key at scan time)
    const qr = qrRect(quiz.items.length)
    bubbleQr(pdf, `QZ1:${quiz.id}`, qr.x, qr.y, qr.size)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor('#6b7280')
    pdf.text('Do not write inside the QR code', qr.x, qr.y + qr.size + 10)

    // bubble grid
    const layout = bubbleSheetLayout(quiz.items.length)
    const gridTop = f.y + SHEET.gridDy
    let idx = 0
    layout.columns.forEach((col, ci) => {
      for (let r = 0; r < col.count; r++) {
        const item = quiz.items[idx]
        const qy = gridTop + r * rowPitch(quiz.items.length)
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#374151')
        pdf.text(String(col.start + r), columnX(quiz.items.length, ci), qy + 4)
        for (let b = 0; b < 4; b++) {
          const bx = columnX(quiz.items.length, ci) + SHEET.rowLabelPad + b * (SHEET.circleR * 2 + SHEET.bubbleGap) + SHEET.circleR
          pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1)
          pdf.circle(bx, qy, SHEET.circleR, 'S')
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor('#9ca3af')
          pdf.text(SHEET.letters[b], bx, qy + 2, { align: 'center', baseline: 'middle' })
        }
        idx++
      }
    })

    // student-number strip: two rows of digit bubbles (tens / ones, 0–9).
    // The scanner reads these first, so a shuffled pile still identifies
    // whose sheet it is — numbers belong to students, not to seats.
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor('#374151')
    pdf.text('STUDENT NO.', f.x + 8, f.y + f.h - 29)
    for (let row = 0; row < 2; row++) {
      for (let d = 0; d <= 9; d++) {
        const c = idDigitCenter(quiz.items.length, row, d)
        pdf.setDrawColor('#0b0820'); pdf.setLineWidth(0.9)
        pdf.circle(c.x, c.y, SHEET.idBubbleR, 'S')
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(4.5); pdf.setTextColor('#9ca3af')
        pdf.text(String(d), c.x, c.y + 1.4, { align: 'center', baseline: 'middle' })
      }
    }

    // write-in fields below the frame
    const by = f.y + f.h + 34
    pdf.setFontSize(10); pdf.setTextColor('#1c2438')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Student Name:', SHEET.M, by)
    pdf.setFont('helvetica', 'normal')
    pdf.line(SHEET.M + 78, by + 2, SHEET.W / 2 - 14, by + 2)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Date:', SHEET.W / 2, by)
    pdf.setFont('helvetica', 'normal')
    pdf.line(SHEET.W / 2 + 30, by + 2, SHEET.W / 2 + 130, by + 2)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Grade & Section:', SHEET.M, by + 24)
    pdf.setFont('helvetica', 'normal')
    pdf.line(SHEET.M + 90, by + 26, SHEET.W / 2 + 60, by + 26)
  }

  return pdf
}

export async function exportBubbleSheets(quiz, copies = 1, size = 'letter') {
  const pdf = await buildBubbleSheetsPdf(quiz, copies, size)
  pdf.save(`quizard-bubble-sheets-${slug(quiz.subject || quiz.title)}.pdf`)
}
