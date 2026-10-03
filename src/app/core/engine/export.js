import qrModule from 'qrcode-generator'
import { SHEET, bubbleSheetLayout, frameRect, markerRects, columnX, rowLabelRight, bubbleCenter, qrRect, idDigitCenter, rowPitch } from './sheet-spec.js'
import { sectionBreakdown } from './reports.js'

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
  const pdf = await buildClassReportPdf(cls, quiz, sheets, analysis)
  pdf.save(`quizard-results-${slug(cls.name)}.pdf`)
}

/** Same report as exportClassReportPdf, but returns the document for preview. */
export async function buildClassReportPdf(cls, quiz, sheets, analysis) {
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
    // roster snapshot: number, grade and section travel with the result
    const who = [s.studentNo != null ? `#${s.studentNo}` : '', s.grade, s.section].filter(Boolean).join(' · ')
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor('#9ca3af')
    if (who) pdf.text(pdfSafe(who), M + 6 + pdf.getTextWidth(s.studentName) + 12, y + 10)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5); pdf.setTextColor('#1c2438')
    pdf.text(`${s.correct}/${s.total}`, W - M - 90, y + 10)
    pdf.text(`${s.percent}%`, W - M - 34, y + 10)
    y += 16
  }

  const sections = sectionBreakdown(sheets)
  if (sections.length > 1) {
    y += 10
    text('By section', { size: 13, bold: true, gap: 6 })
    for (const g of sections) {
      need(20)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5); pdf.setTextColor('#1c2438')
      pdf.text(pdfSafe(g.section), M + 6, y + 10)
      pdf.setTextColor('#6b7280')
      pdf.text(`${g.count} checked · low ${g.lowest}% · high ${g.highest}%`, M + 120, y + 10)
      pdf.setFont('helvetica', 'bold'); pdf.setTextColor('#1c2438')
      pdf.text(`${g.avg}%`, W - M - 34, y + 10)
      y += 16
    }
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

  return pdf
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

// The scannable answer sheet. One clean bordered box holding nothing but the
// numbered bubble grid, the student-number strip and the QR; a compact header
// lockup above and write-in rules below. Every coordinate comes from
// sheet-spec.js, which the Phase 3 scanner also samples, so what is printed is
// what is read back.
/**
 * @typedef {'letter' | 'a4' | 'long'} PaperSize
 */
const PAPER = { letter: [612, 792], a4: [595, 842], long: [612, 936] }

// A 24x19 vector printer — the standard PDF fonts have no glyph for one.
function printerGlyph(pdf, x, y) {
  pdf.setDrawColor('#0b0820'); pdf.setLineWidth(0.8)
  pdf.setFillColor('#ffffff')
  pdf.rect(x + 6, y, 12, 6, 'FD')      // paper feeding in
  pdf.setFillColor('#e9e6f7')
  pdf.rect(x, y + 5, 24, 9, 'FD')      // body
  pdf.setFillColor('#ffffff')
  pdf.rect(x + 5, y + 12, 14, 7, 'FD') // sheet coming out
}

function sheetHeader(pdf, quiz) {
  const right = SHEET.W - SHEET.M

  // left lockup: purple roundel + wordmark + tagline
  pdf.setFillColor('#7c3aed'); pdf.circle(SHEET.M + 11, 30, 11, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor('#ffffff')
  pdf.text('Q', SHEET.M + 11, 34.5, { align: 'center' })
  pdf.setFontSize(15); pdf.setTextColor('#1c2438')
  pdf.text('Q U I Z A R D', SHEET.M + 30, 34)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor('#9ca3af')
  pdf.text('P R I N T A B L E   A N S W E R   S H E E T S', SHEET.M + 31, 44)

  // right: printer glyph + PRINT SHEETS
  printerGlyph(pdf, right - 24, 18)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor('#1c2438')
  pdf.text('PRINT SHEETS', right - 30, 32, { align: 'right' })

  // quiz title, plus the one instruction that matters (dropped if it crowds)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12.5); pdf.setTextColor('#1c2438')
  const title = pdfSafe(quiz.subject + (quiz.title ? ' — ' + quiz.title : ''))
  pdf.text(title, SHEET.M, 74)
  const hint = 'Shade ONE circle per row, and your student number, fully.'
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5)
  const room = SHEET.W - SHEET.M * 2 - pdf.getTextWidth(title) - 20
  if (room > pdf.getTextWidth(hint)) {
    pdf.setTextColor('#6b7280')
    pdf.text(hint, right, 74, { align: 'right' })
  }
}

// Builds the bubble-sheet document (preview renders this; export saves it).
export async function buildBubbleSheetsPdf(quiz, copies = 1, size = 'letter') {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: PAPER[size] || PAPER.letter })
  const count = quiz.items.length

  for (let copy = 0; copy < Math.max(1, Math.min(60, copies)); copy++) {
    if (copy > 0) pdf.addPage()

    sheetHeader(pdf, quiz)

    const f = frameRect(count)
    pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1.8)
    pdf.rect(f.x, f.y, f.w, f.h, 'S')

    // alignment squares, parked in the page margins so the box stays clean
    pdf.setFillColor('#0b0820')
    for (const m of markerRects(count)) pdf.rect(m.x, m.y, SHEET.marker, SHEET.marker, 'F')

    // QR (identifies the quiz/key at scan time)
    const qr = qrRect(count)
    bubbleQr(pdf, `QZ1:${quiz.id}`, qr.x, qr.y, qr.size)

    // bubble grid: small grey numerals right-aligned against four circles
    const layout = bubbleSheetLayout(count)
    let idx = 0
    layout.columns.forEach((col, ci) => {
      for (let r = 0; r < col.count; r++) {
        const qy = bubbleCenter(count, idx, 0).y
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor('#6b7280')
        pdf.text(String(col.start + r), rowLabelRight(count, ci), qy + 2.6, { align: 'right' })
        pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1.1)
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor('#6b7280')
        for (let b = 0; b < SHEET.letters.length; b++) {
          const bc = bubbleCenter(count, idx, b)
          pdf.circle(bc.x, bc.y, SHEET.circleR, 'S')
          // letter centred on the cap height so it reads as part of the bubble
          pdf.text(SHEET.letters[b], bc.x, bc.y + SHEET.letterCap / 2, { align: 'center' })
        }
        idx++
      }
    })

    // student-number strip: two rows of digit bubbles (tens / ones, 0–9).
    // The scanner reads these first, so a shuffled pile still identifies
    // whose sheet it is — numbers belong to students, not to seats.
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor('#9ca3af')
    pdf.text('S T U D E N T   N O .', f.x + 14, f.y + f.h - SHEET.idLabelDy)
    for (let row = 0; row < 2; row++) {
      for (let d = 0; d <= 9; d++) {
        const c = idDigitCenter(count, row, d)
        pdf.setDrawColor('#0b0820'); pdf.setLineWidth(0.8)
        pdf.circle(c.x, c.y, SHEET.idBubbleR, 'S')
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(4.5); pdf.setTextColor('#9ca3af')
        pdf.text(String(d), c.x, c.y + 1.4, { align: 'center', baseline: 'middle' })
      }
    }

    // write-in rules below the frame
    const rule = (label, x, w, y) => {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor('#1c2438')
      pdf.text(label, x, y)
      pdf.setDrawColor('#9ca3af'); pdf.setLineWidth(0.7)
      pdf.line(x + pdf.getTextWidth(label) + 6, y + 2.5, x + w, y + 2.5)
    }
    const by = f.y + f.h + 32
    rule('Student Name:', SHEET.M, SHEET.W - SHEET.M, by)
    rule('Date:', SHEET.M, 220, by + 24)
    rule('Grade & Section:', 330, SHEET.W - SHEET.M, by + 24)
  }

  return pdf
}

export async function exportBubbleSheets(quiz, copies = 1, size = 'letter') {
  const pdf = await buildBubbleSheetsPdf(quiz, copies, size)
  pdf.save(`quizard-bubble-sheets-${slug(quiz.subject || quiz.title)}.pdf`)
}
