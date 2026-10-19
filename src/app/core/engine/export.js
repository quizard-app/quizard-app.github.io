import qrModule from 'qrcode-generator'
import { SHEET, bubbleSheetLayout, frameRect, markerRects, columnX, rowLabelRight, bubbleCenter, qrRect, rowPitch, sheetQrPayload, qrCaption } from './sheet-spec.js'
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

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#17677C')
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
    pdf.setFillColor('#17677C'); pdf.rect(M + 28, y + 13, barW * r.missRate / 100, 5, 'F')
    y += 22
  }
  if (!analysis.some(r => r.attempted)) text('No attempts recorded yet.', { size: 10, color: '#6b7280' })

  return pdf
}

// ── Student answer review: the full answer list, one page per student ──
// Every question number from 1 to N with the student's letter — green when it
// was right, red when it was wrong (with the keyed answer after the arrow),
// grey when left blank. The teacher sees exactly which numbers each student
// missed and what the right choice was, all on a single page.
export async function exportReviewPdf(quiz, sheets) {
  const pdf = await buildReviewPdf(quiz, sheets)
  pdf.save(`quizard-review-${slug(quiz.subject + (quiz.title ? ' - ' + quiz.title : ''))}.pdf`)
}

/** Same review as exportReviewPdf, but returns the document for preview. */
export async function buildReviewPdf(quiz, sheets) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = 612, H = 792, M = 48
  const LETTERS = ['A', 'B', 'C', 'D', 'E']
  const COLS = 5
  const colW = (W - M * 2) / COLS
  const cellH = 17
  let y = 0
  const need = h => { if (y + h > H - M) { pdf.addPage(); y = M } }

  sheets.forEach((s, si) => {
    // every student starts on a fresh page
    if (si > 0) pdf.addPage()
    y = M
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#17677C')
    pdf.text('Q U I Z A R D   ·   A N S W E R   R E V I E W', M, M + 6)
    y = M + 24
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor('#1c2438')
    pdf.text(pdfSafe(s.studentName), M, y + 12)
    const score = `${s.correct}/${s.total} · ${s.percent}%`
    pdf.setFontSize(11)
    pdf.text(score, W - M - pdf.getTextWidth(score), y + 12)
    y += 18
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor('#6b7280')
    const who = [s.studentNo != null ? `#${s.studentNo}` : '', s.grade, s.section].filter(Boolean).join(' · ')
    const meta = [quiz.subject + (quiz.title ? ' — ' + quiz.title : ''), who, new Date(s.createdAt).toLocaleDateString()].filter(Boolean).join(' · ')
    pdf.text(pdfSafe(meta), M, y + 8)
    y += 16
    pdf.setFontSize(8.5); pdf.setTextColor('#9ca3af')
    pdf.text('Green — correct · red — wrong, keyed answer after the arrow · grey — left blank', M, y + 8)
    y += 16

    for (let qi = 0; qi < quiz.items.length; qi++) {
      const it = quiz.items[qi]
      const pick = s.answers ? s.answers[qi] : undefined
      const hasPick = pick != null && pick >= 0
      const right = hasPick && pick === it.answerIndex
      if (qi % COLS === 0) need(cellH)
      const x = M + (qi % COLS) * colW
      const n = it.n || qi + 1
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#9ca3af')
      pdf.text(`${n}.`, x, y + 10)
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11)
      pdf.setTextColor(!hasPick ? '#9ca3af' : right ? '#15803d' : '#b91c1c')
      pdf.text(hasPick ? LETTERS[pick] : '—', x + 22, y + 10)
      if (!right && it.answerIndex != null && it.answerIndex >= 0) {
        // the miss shows its correction: the keyed letter, in green
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#15803d')
        pdf.text(`-> ${LETTERS[it.answerIndex]}`, x + 40, y + 10)
      }
      if (qi % COLS === COLS - 1 || qi === quiz.items.length - 1) y += cellH
    }
  })
  return pdf
}

// ── Teacher app exports (PLAN.md Phase 2): quiz paper, teacher key, bubble sheets ──
// Geometry lives in sheet-spec.js — the Phase 3 scanner samples the same
// constants, so the printed sheet and the scanner agree by construction.

function bubbleQr(pdf, text, x, y, size, level = 'M') {
  // qrcode-generator is CJS; esbuild interop gives us the factory
  const qrFactory = qrModule.default || qrModule
  // Student names are user text (José, Ñoño, emoji). The default encoder is
  // latin-1 (charCode & 0xff), which produces bytes that are invalid UTF-8 —
  // and the scanner's jsQR decodes byte mode as UTF-8, so those QRs silently
  // fail to decode at scan time. Encode as real UTF-8 instead.
  if (qrFactory.stringToBytesFuncs && qrFactory.stringToBytesFuncs['UTF-8']) {
    qrFactory.stringToBytes = qrFactory.stringToBytesFuncs['UTF-8']
  }
  const qr = qrFactory(0, level)
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

// The scannable answer sheet. One clean bordered box holding nothing but the
// numbered bubble grid, the student-number strip and the QR; a compact header
// lockup above and write-in rules below. Every coordinate comes from
// sheet-spec.js, which the Phase 3 scanner also samples, so what is printed is
// what is read back.
/**
 * @typedef {'letter' | 'a4' | 'long'} PaperSize
 */
const PAPER = { letter: [612, 792], a4: [595, 842], long: [612, 936] }

function sheetHeader(pdf, quiz, student) {
  const right = SHEET.W - SHEET.M

  // left lockup: purple roundel + wordmark + tagline
  pdf.setFillColor('#17677C'); pdf.circle(SHEET.M + 11, 30, 11, 'F')
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor('#ffffff')
  pdf.text('Q', SHEET.M + 11, 34.5, { align: 'center' })
  pdf.setFontSize(15); pdf.setTextColor('#1c2438')
  pdf.text('Q U I Z A R D', SHEET.M + 30, 34)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor('#9ca3af')
  pdf.text('P R I N T A B L E   A N S W E R   S H E E T S', SHEET.M + 31, 44)

  // quiz title, plus the one instruction that matters (dropped if it crowds)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12.5); pdf.setTextColor('#1c2438')
  const title = pdfSafe(quiz.subject + (quiz.title ? ' — ' + quiz.title : ''))
  pdf.text(title, SHEET.M, 66)
  const hint = 'Shade ONE circle per row fully with pen or pencil.'
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5)
  const room = SHEET.W - SHEET.M * 2 - pdf.getTextWidth(title) - 20
  if (room > pdf.getTextWidth(hint)) {
    pdf.setTextColor('#6b7280')
    pdf.text(hint, right, 66, { align: 'right' })
  }

  // write-in fields at the top, under the title: who + when + where
  const rule = (label, x, w, y) => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor('#1c2438')
    pdf.text(label, x, y)
    pdf.setDrawColor('#9ca3af'); pdf.setLineWidth(0.7)
    pdf.line(x + pdf.getTextWidth(label) + 6, y + 2.5, x + w, y + 2.5)
  }
  rule('Student Name:', SHEET.M, 300, 92)
  if (student?.name) {
    // roster sheets print the name on the rule, so the stack can be verified
    // by eye before any scanning happens
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor('#1c2438')
    const nameX = SHEET.M + pdf.getTextWidth('Student Name:') + 12
    const cap = 300 - (nameX - SHEET.M) - 4
    let nm = String(student.name)
    if (pdf.getTextWidth(nm) > cap) {
      while (nm.length > 4 && pdf.getTextWidth(nm + '…') > cap) nm = nm.slice(0, -1)
      nm += '…'
    }
    pdf.text(nm, nameX, 92)
  }
  rule('Date:', 360, 110, 92)
  rule('Grade & Section:', SHEET.M, 240, 114)
}

// Builds the bubble-sheet document (preview renders this; export saves it).
// Sheets are printed per roster student — exactly one page per student on the
// class, never blanks — because the QR on each sheet is what tells the scanner
// whose paper it is.
export async function buildBubbleSheetsPdf(quiz, students, size = 'letter') {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: PAPER[size] || PAPER.letter })
  const count = quiz.items.length
  const roster = Array.isArray(students) ? students : []
  const pages = Math.max(1, roster.length)

  for (let copy = 0; copy < pages; copy++) {
    if (copy > 0) pdf.addPage()
    const student = roster[copy] || null

    sheetHeader(pdf, quiz, student)

    const f = frameRect()
    pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1.8)
    pdf.rect(f.x, f.y, f.w, f.h, 'S')

    // alignment squares, parked in the page margins so the box stays clean
    pdf.setFillColor('#0b0820')
    for (const m of markerRects(count)) pdf.rect(m.x, m.y, SHEET.marker, SHEET.marker, 'F')

    // QR: identifies the quiz, and the student when printed for a roster. A
    // name makes the payload long, so roster sheets drop to level L — fewer
    // modules keeps the cell size large enough to scan from a phone photo.
    const qr = qrRect(count)
    bubbleQr(pdf, sheetQrPayload(quiz.id, student), qr.x, qr.y, qr.size, student ? 'L' : 'M')

    // the roster number and name in plain sight under the code, so a printed
    // stack can be sorted and handed out from the bottom of the page alone
    if (student?.name) {
      const cap = qrCaption(count)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor('#6b7280')
      let who = [student.no != null ? '#' + student.no : '', student.name].filter(Boolean).join(' ')
      if (pdf.getTextWidth(who) > cap.maxWidth) {
        while (who.length > 4 && pdf.getTextWidth(who + '…') > cap.maxWidth) who = who.slice(0, -1)
        who += '…'
      }
      pdf.text(who, cap.right, cap.baseline, { align: 'right' })
    }

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

  }

  return pdf
}

export async function exportBubbleSheets(quiz, students, size = 'letter') {
  const pdf = await buildBubbleSheetsPdf(quiz, students, size)
  pdf.save(`quizard-bubble-sheets-${slug(quiz.subject || quiz.title)}.pdf`)
}
