import { summarizeDoc } from './summarize.js'
import { stripSlideMarkers } from './textproc.js'
import { rankExamTopics } from './exam.js'
import qrModule from 'qrcode-generator'

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

function stamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function firstOpaqueColor(colors) {
  return colors.find(color => color && color !== 'transparent' && !/rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/i.test(color)) || '#ffffff'
}

async function waitForReviewerPaint() {
  if (document.fonts?.ready) await document.fonts.ready
  await new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(resolve))
    else setTimeout(resolve, 0)
  })
}

export async function exportReviewerPdf(element, documentName) {
  if (!element?.isConnected || !element.scrollHeight) throw new Error('Reviewer content is not ready')

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ])
  await waitForReviewerPaint()

  const rootStyle = getComputedStyle(document.documentElement)
  const bodyStyle = getComputedStyle(document.body)
  const elementStyle = getComputedStyle(element)
  const backgroundColor = firstOpaqueColor([
    elementStyle.backgroundColor,
    bodyStyle.backgroundColor,
    rootStyle.backgroundColor
  ])
  const surfaceColor = elementStyle.getPropertyValue('--surface').trim() || backgroundColor
  const warnBackground = elementStyle.getPropertyValue('--warn-bg').trim() || surfaceColor
  const warnBorder = elementStyle.getPropertyValue('--warn-border').trim() || warnBackground
  const width = Math.max(1, Math.ceil(element.getBoundingClientRect().width || element.scrollWidth))
  const height = Math.ceil(element.scrollHeight)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2
  const sliceHeight = contentHeight * width / contentWidth
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
  const captureOptions = {
    backgroundColor,
    logging: false,
    scale,
    useCORS: true,
    imageTimeout: 15000,
    width,
    windowWidth: Math.max(width, document.documentElement.clientWidth || width),
    windowHeight: Math.max(height, document.documentElement.clientHeight || 0),
    onclone: async clonedDocument => {
      const clone = clonedDocument.getElementById('review-content')
      if (!clone) return
      clone.classList.add('reviewer-pdf-export')
      clone.style.backgroundColor = backgroundColor
      clone.querySelectorAll('.ai-term').forEach(node => { node.style.backgroundColor = surfaceColor })
      clone.querySelectorAll('.ai-gaps').forEach(node => {
        node.style.backgroundColor = warnBackground
        node.style.borderColor = warnBorder
      })
      clone.querySelectorAll('.ai-table').forEach(node => {
        node.style.display = 'table'
        node.style.overflow = 'visible'
        node.style.tableLayout = 'fixed'
      })
      await new Promise(resolve => clonedDocument.defaultView?.requestAnimationFrame(resolve) || setTimeout(resolve, 0))
    }
  }

  let pageIndex = 0
  let foreignObjectRendering = false
  for (let y = 0; y < height; y += sliceHeight) {
    const captureHeight = Math.min(sliceHeight, height - y)
    let canvas
    try {
      canvas = await html2canvas(element, { ...captureOptions, x: 0, y, height: captureHeight, foreignObjectRendering })
    } catch (error) {
      if (foreignObjectRendering || !/unsupported color function/i.test(String(error?.message || error))) throw error
      foreignObjectRendering = true
      canvas = await html2canvas(element, { ...captureOptions, x: 0, y, height: captureHeight, foreignObjectRendering })
    }
    if (pageIndex) pdf.addPage()
    const imageHeight = canvas.height * contentWidth / canvas.width
    pdf.addImage(canvas, 'PNG', margin, margin, contentWidth, imageHeight, undefined, 'FAST')
    pageIndex++
  }

  pdf.setProperties({
    title: `${documentName || 'Document'} — AI Reviewer`,
    subject: 'Reviewer exported from Quizard',
    creator: 'Quizard'
  })
  const fileSlug = slug(String(documentName || 'doc').replace(/\.[^.]+$/, ''))
  await pdf.save(`quizard-reviewer-${fileSlug}.pdf`)
  return true
}

// Text-based AI reviewer PDF: built from the reviewer data instead of a
// screenshot — instant on phones, selectable text, no html2canvas hangs.
function pdfSafe(s) {
  return String(s || '')
    .replace(/→/g, ' -> ')
    // arrows, dingbats, emoji and variation selectors that the standard PDF
    // fonts cannot render (→ is converted, the rest are dropped)
    .replace(/[\u2190-\u21FF\u2300-\u27BF\uFE0F]|[\uD800-\uDFFF]/g, '')
}

export async function exportAiReviewerPdf(reviewer, documentName) {
  if (!reviewer?.parts?.length) throw new Error('Reviewer is not ready')
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = 595.28, H = 841.89, M = 56
  let y = 0

  const page = () => { pdf.addPage(); y = M }
  const need = h => { if (y + h > H - M) page() }
  const text = (str, { size = 11, bold = false, color = '#1c2438', gap = 6, indent = 0 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(color)
    const lines = pdf.splitTextToSize(pdfSafe(str), W - M * 2 - indent)
    need(lines.length * (size + 3))
    lines.forEach(line => { pdf.text(line, M + indent, y + size); y += size + 3 })
    y += gap
  }
  const rule = () => { need(14); pdf.setDrawColor('#d9d2f2'); pdf.line(M, y + 6, W - M, y + 6); y += 14 }
  const section = (label) => { rule(); need(24); text(label, { size: 13, bold: true, color: '#5b3df5', gap: 6 }) }

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('A I   E X A M   R E V I E W E R', M, M + 8)
  y = M + 26
  text(reviewer.title, { size: 20, bold: true, gap: 2 })
  if (reviewer.intro) text(reviewer.intro, { size: 10.5, color: '#475069', gap: 10 })
  text(documentName ? documentName + ' · prepared ' + stamp() : 'prepared ' + stamp(), { size: 9, color: '#868ea8', gap: 10 })
  rule()

  const acronyms = reviewer.acronyms || []
  if (acronyms.length) {
    section('Key Acronyms')
    acronyms.forEach(a => {
      need(26)
      text(a.acr + ' - ' + a.expansion, { size: 11, bold: true, gap: 1, indent: 0 })
      if (a.meaning) text(a.meaning, { size: 10, color: '#475069', indent: 12, gap: 4 })
    })
  }

  let num = 0
  for (const part of reviewer.parts) {
    rule()
    need(26)
    num++
    text('PART ' + roman(num) + ' - ' + (part.title || ''), { size: 13, bold: true, color: '#5b3df5', gap: 6 })
    for (const sec of part.sections) {
      need(40)
      const stars = sec.stars ? ' (' + '*'.repeat(sec.stars) + ')' : ''
      text(sec.num + '. ' + sec.heading + stars, { size: 12, bold: true, gap: 2 })
      if (sec.mustKnow) text('[' + sec.mustKnow + ']', { size: 9.5, bold: true, color: '#b54708', indent: 12, gap: 3 })
      if (sec.definition) text(sec.definition, { size: 11, bold: true, indent: 12, gap: 3 })
      if (sec.explanation) text(sec.explanation, { size: 10.5, color: '#475069', indent: 12, gap: 4 })
      for (const t of (sec.terms || [])) {
        need(30)
        text('  ' + t.term, { size: 11, bold: true, indent: 12, gap: 1 })
        if (t.meaning) text('Meaning: ' + t.meaning, { size: 10, color: '#475069', indent: 24, gap: 2 })
        ;(t.bullets || []).forEach(b => text('-  ' + b, { size: 10, color: '#475069', indent: 24, gap: 1 }))
        if (t.memory) text('Memory: ' + t.memory, { size: 10, bold: true, color: '#5b3df5', indent: 24, gap: 5 })
      }
      ;(sec.bullets || []).forEach(b => text('-  ' + b, { size: 10.5, color: '#475069', indent: 12, gap: 1 }))
      ;(sec.steps || []).forEach((st, i) => text((i + 1) + '.  ' + st, { size: 10.5, color: '#475069', indent: 12, gap: 1 }))
      if (sec.table) {
        const headers = sec.table.headers || []
        for (const row of sec.table.rows) {
          text(row.map((c, k) => (headers[k] ? headers[k] + ': ' : '') + c).join('  |  '), { size: 10, color: '#475069', indent: 12, gap: 2 })
        }
      }
      if (sec.mnemonic) text('Memorize: ' + sec.mnemonic, { size: 10.5, bold: true, color: '#5b3df5', indent: 12, gap: 4 })
      if (sec.important) text('Important: ' + sec.important, { size: 10, color: '#b54708', indent: 12, gap: 3 })
      if (sec.example) text('Example: ' + sec.example, { size: 10, color: '#475069', indent: 12, gap: 3 })
      if (sec.memory) text('Memory trick: ' + sec.memory, { size: 10, bold: true, color: '#5b3df5', indent: 12, gap: 3 })
      if (sec.examClue) text('Exam clue: ' + sec.examClue, { size: 10, color: '#0f9d6a', indent: 12, gap: 6 })
    }
  }

  const acr2 = reviewer.acronyms || []
  const highYield = reviewer.highYield || []
  if (highYield.length) {
    section('Super Important Exam Points')
    text('If you are short on study time, memorize these first:', { size: 10.5, color: '#475069', gap: 5 })
    for (const h of highYield) {
      need(30)
      text(h.label, { size: 11, bold: true, gap: 1 })
      h.items.forEach(i => text('-  ' + i, { size: 10.5, color: '#475069', indent: 12, gap: 1 }))
    }
  }
  const idq = reviewer.idQuestions || []
  if (idq.length) {
    section('Possible Identification Questions')
    idq.forEach(q => {
      need(30)
      text(q.clue, { size: 10.5, gap: 1 })
      text('Answer: ' + q.answer, { size: 10.5, bold: true, color: '#0f9d6a', indent: 12, gap: 5 })
    })
  }
  const myths = reviewer.myths || []
  if (myths.length) {
    section('Myths vs Facts')
    myths.forEach(m => {
      need(36)
      text('Myth: ' + m.myth, { size: 10.5, color: '#b54708', gap: 1 })
      text('Fact: ' + m.fact, { size: 10.5, color: '#0f9d6a', indent: 12, gap: 6 })
    })
  }
  const finalReview = reviewer.finalReview || []
  if (finalReview.length) {
    section('One-Minute Final Review')
    finalReview.forEach(line => text('-  ' + line, { size: 10.5, gap: 2 }))
  }
  const gaps = reviewer.gaps || []
  if (gaps.length) {
    section('Coverage notes')
    gaps.forEach(g => text('-  ' + g, { size: 10, color: '#868ea8', gap: 3 }))
  }

  rule()
  text('Generated ' + stamp() + ' · exported from Quizard', { size: 9, color: '#868ea8' })
  pdf.setProperties({ title: (documentName || 'Document') + ' - AI Reviewer', subject: 'Reviewer exported from Quizard', creator: 'Quizard' })
  const fileSlug = slug(String(documentName || 'doc').replace(/\.[^.]+$/, ''))
  await pdf.save('quizard-reviewer-' + fileSlug + '.pdf')
  return true
}

function optionLetters(n) {
  return 'ABCDEFGH'.slice(0, n).split('')
}

// Classic school-quiz sections. Questions are grouped by type, numbered
// continuously, and every section opens with a Directions line.
const QUIZ_SECTIONS = [
  { type: 'mcq', title: 'Multiple Choice', directions: 'Read each question carefully. Choose the letter of the best answer.' },
  { type: 'except', title: 'Multiple Choice — Except', directions: 'Read each question carefully. Choose the letter of the statement that is NOT true.' },
  { type: 'multi', title: 'Multiple Choice — Select Two', directions: 'Read each question carefully. Choose the letters of the TWO correct answers.' },
  { type: 'tf', title: 'True or False', directions: 'Read each statement carefully. Write T if the statement is true and F if it is false.' },
  { type: 'fib', title: 'Fill in the Blank', directions: 'Choose the word or phrase that best completes each statement.' },
  { type: 'id', title: 'Identification', directions: 'Read each description carefully. Identify the term being described.' },
  { type: 'short', title: 'Short Answer', directions: 'Read each question carefully. Answer in a word or a short phrase.' },
  { type: 'matching', title: 'Matching Type', directions: 'Match each term to its definition. Write the letter of your choice on the blank.' },
  { type: 'ordering', title: 'Ordering', directions: 'Arrange the items in the correct order from first to last.' }
]

export function buildSummaryMarkdown(doc) {
  const summary = summarizeDoc(stripSlideMarkers(doc.text))
  const out = [`# ${doc.name}`, '', `_Pointers to review · generated ${stamp()}_`, '']
  if (summary.tldr.length) {
    out.push('## Key pointers', '')
    summary.tldr.forEach(p => out.push(`- ${p}`))
    out.push('')
  }
  summary.sections.forEach((sec, i) => {
    out.push(`## ${i + 1}. ${sec.title}`, '')
    sec.points.forEach(p => out.push(`- ${p}`))
    out.push('')
  })
  out.push('---', `_${(doc.wordCount || 0).toLocaleString()} words · exported from Quizard_`, '')
  return out.join('\n')
}

export function buildQuizMarkdown(docName, questions, review) {
  const out = [`# Quiz — ${docName}`, '', `_Generated ${stamp()}_`, '']
  let n = 0

  for (const section of QUIZ_SECTIONS) {
    const qs = questions.filter(q => q.type === section.type)
    if (!qs.length) continue

    out.push(`### ${section.title}`, '')
    out.push(`**Directions:** ${section.directions}`, '')

    for (const q of qs) {
      n++
      const i = questions.indexOf(q)
      const rev = review?.[i]

      if (q.type === 'matching') {
        out.push(`**${n}.** ${q.prompt || 'Match each term to its definition'}`)
        out.push('')
        const letters = optionLetters((q.pairs || []).length)
        out.push('| Term | Answer |', '| --- | --- |')
        ;(q.pairs || []).forEach((p, k) => out.push(`| ${p.left} | ${letters[k]}. ${p.right} |`))
        out.push('')
      } else if (q.type === 'ordering') {
        out.push(`**${n}.** ${q.prompt || 'Put the steps in the correct order'}`)
        out.push('')
        ;(q.shuffled || q.steps || []).forEach((s, k) => out.push(`${'ABCDEFGH'[k]}. ${s}`))
        out.push('')
      } else {
        const prompt = q.statement || q.stem || q.clue || q.prompt || ''
        out.push(`**${n}. ${prompt}**`)
        out.push('')
        let opts = null
        if (q.type === 'mcq' || q.type === 'except' || q.type === 'multi' || q.type === 'fib') opts = q.options || q.choices
        else if (q.type === 'tf') opts = ['True', 'False']
        if (opts) {
          const letters = optionLetters(opts.length)
          opts.forEach((o, k) => out.push(`${letters[k]}. ${o}`))
          out.push('')
        }
      }

      const answer = q.type === 'id' || q.type === 'short'
        ? q.answer
        : q.type === 'tf'
          ? String(q.answer)
          : q.type === 'multi'
            ? (q.answerIndices || []).map(k => 'ABCDEFGH'[k]).filter(x => x).join(' · ')
            : q.type === 'matching'
              ? (q.pairs || []).map((p, k) => `${'ABCDEFGH'[k]}. ${p.right}`).join(' · ')
              : q.type === 'ordering'
                ? (q.steps || []).map((s, k) => `${k + 1}. ${s}`).join(' → ')
                : 'ABCDEFGH'[q.answerIndex] + '. ' + ((q.options ?? q.choices)?.[q.answerIndex] ?? '')
      out.push(`**Answer:** ${answer ?? '(ungraded)'}`)
      if (rev && !rev.ok && rev.chosen != null) out.push(`_Your answer: ${rev.chosen}_`)
      out.push('')
    }
  }

  // any type without a declared section (safety net so nothing is dropped)
  const covered = new Set(QUIZ_SECTIONS.map(s => s.type))
  const rest = questions.filter(q => !covered.has(q.type))
  for (const q of rest) {
    n++
    const i = questions.indexOf(q)
    out.push(`**${n}. ${q.statement || q.stem || q.clue || q.prompt || ''}**`, '')
    out.push(`**Answer:** ${q.answer ?? (q.options ?? q.choices)?.[q.answerIndex] ?? '(ungraded)'}`, '')
    const rev = review?.[i]
    if (rev && !rev.ok && rev.chosen != null) out.push(`_Your answer: ${rev.chosen}_`)
    out.push('')
  }

  out.push('---', '_Exported from Quizard_', '')
  return out.join('\n')
}

export function exportSummary(doc) {
  download(`quizard-pointers-${slug(doc.name)}.md`, buildSummaryMarkdown(doc))
}

/* Real PDF handout: same structure as the reviewer screen, generated with
   jsPDF (lazy-loaded so it never sits in the main bundle). */
export async function exportPdfHandout(doc, extras = {}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = 595.28, H = 841.89, M = 56
  const maxW = W - M * 2
  let y = 0

  const page = () => { pdf.addPage(); y = M }
  const need = h => { if (y + h > H - M) page() }
  const text = (str, { size = 11, bold = false, color = '#1c2438', gap = 6, indent = 0 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(color)
    const lines = pdf.splitTextToSize(str, maxW - indent)
    need(lines.length * (size + 3))
    lines.forEach(line => { pdf.text(line, M + indent, y + size); y += size + 3 })
    y += gap
  }
  const rule = () => { need(14); pdf.setDrawColor('#d9d2f2'); pdf.line(M, y + 6, W - M, y + 6); y += 14 }

  // title block
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('P O I N T E R S   T O   R E V I E W', M, M + 8)
  y = M + 26
  text(doc.name, { size: 20, bold: true, gap: 2 })
  text(`${(doc.wordCount || 0).toLocaleString()} words · forged from your document · ${stamp()}`, { size: 9, color: '#868ea8', gap: 10 })
  rule()

  // I. key pointers
  const summary = summarizeDoc(stripSlideMarkers(doc.text))
  if (summary.tldr.length) {
    text('I. Key pointers', { size: 13, bold: true, color: '#5b3df5' })
    summary.tldr.forEach(p => text('•  ' + p, { size: 10.5, color: '#475069', indent: 10, gap: 2 }))
    y += 4
  }

  // II. key terms
  if (extras.keyTermDefs?.length) {
    rule()
    text('II. Key terms to know', { size: 13, bold: true, color: '#5b3df5' })
    for (const t of extras.keyTermDefs) {
      text(t.term, { size: 11, bold: true, color: '#5b3df5', gap: 1 })
      text(t.def, { size: 10.5, color: '#475069', indent: 12, gap: 8 })
    }
  }

  // III. pointers by section
  if (summary.sections.length) {
    rule()
    text('III. Pointers by section', { size: 13, bold: true, color: '#5b3df5' })
    summary.sections.forEach((sec, i) => {
      need(30)
      text(`${String(i + 1).padStart(2, '0')}  ${sec.title}`, { size: 11.5, bold: true, gap: 3 })
      sec.points.forEach(p => text('•  ' + p, { size: 10.5, color: '#475069', indent: 10, gap: 2 }))
      y += 4
    })
  }

  // IV. recall check — prompts (hints in small gray text)
  if (extras.recallPrompts?.length) {
    rule()
    text('IV. Check your recall', { size: 13, bold: true, color: '#5b3df5' })
    extras.recallPrompts.forEach((p, i) => {
      need(40)
      text(`${i + 1}. ${p.prompt}`, { size: 10.5, bold: true, gap: 2 })
      if (p.hint) text(`Hint: ${p.hint}`, { size: 9.5, color: '#868ea8', indent: 12, gap: 8 })
    })
  }

  rule()
  text(`Generated ${stamp()} · exported from Quizard`, { size: 9, color: '#868ea8' })

  pdf.save(`quizard-reviewer-${slug(doc.name)}.pdf`)
  return true
}

/* Exam prep handout: ranked topics with reasons + per-file section notes. */
export async function exportExamPdf(exam, docs) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = 595.28, H = 841.89, M = 56
  let y = 0

  const page = () => { pdf.addPage(); y = M }
  const need = h => { if (y + h > H - M) page() }
  const text = (str, { size = 11, bold = false, color = '#1c2438', gap = 6, indent = 0 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(color)
    const lines = pdf.splitTextToSize(str, W - M * 2 - indent)
    need(lines.length * (size + 3))
    lines.forEach(line => { pdf.text(line, M + indent, y + size); y += size + 3 })
    y += gap
  }
  const rule = () => { need(14); pdf.setDrawColor('#d9d2f2'); pdf.line(M, y + 6, W - M, y + 6); y += 14 }

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('E X A M   P R E P', M, M + 8)
  y = M + 26
  text(exam.title, { size: 20, bold: true, gap: 2 })
  const when = exam.examDate
    ? new Date(exam.examDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : null
  text(`${when ? when + ' · ' : ''}${docs.length} file${docs.length === 1 ? '' : 's'} · prepared ${stamp()}`, { size: 9, color: '#868ea8', gap: 10 })
  rule()

  if (exam.announcement) {
    text('The announcement', { size: 13, bold: true, color: '#5b3df5' })
    text(exam.announcement, { size: 10.5, color: '#475069' })
  }

  const ranked = rankExamTopics(exam, docs)
  if (ranked.length) {
    rule()
    text('Topics to review — ranked by likelihood', { size: 13, bold: true, color: '#5b3df5' })
    ranked.forEach((t, i) => {
      need(26)
      text(`${i + 1}. ${t.title}`, { size: 11, bold: true, gap: 1 })
      text(`${t.docName}${t.reason ? ' · ' + t.reason : ''}`, { size: 9.5, color: '#868ea8', indent: 12, gap: 4 })
    })
  }

  for (const doc of docs) {
    rule()
    text(doc.name, { size: 13, bold: true, color: '#5b3df5' })
    const summary = summarizeDoc(stripSlideMarkers(doc.text || ''))
    if (summary.tldr.length) summary.tldr.forEach(p => text('•  ' + p, { size: 10.5, color: '#475069', gap: 2 }))
    summary.sections.forEach((sec, i) => {
      need(30)
      text(`${i + 1}. ${sec.title}`, { size: 11, bold: true, gap: 2 })
      sec.points.forEach(p => text('–  ' + p, { size: 10, color: '#475069', indent: 10, gap: 1 }))
    })
  }

  // Add exam questions in the classic quiz format
  if (exam.questions && exam.questions.length) {
    rule()
    text('Exam Questions', { size: 13, bold: true, color: '#5b3df5' })
    const section = { type: 'mcq', title: 'Multiple Choice', directions: 'Read each question carefully. Choose the letter of the best answer.' }
    text(`Directions: ${section.directions}`, { size: 11, bold: true, gap: 2 })
    for (const q of exam.questions) {
      need(30)
      const n = exam.questions.indexOf(q) + 1
      const prompt = q.statement || q.stem || q.clue || q.prompt || ''
      text(`${n}. ${prompt}`, { size: 11, bold: true, gap: 2 })
      text('', { gap: 2 })
      let opts = null
      if (q.type === 'mcq' || q.type === 'except' || q.type === 'multi' || q.type === 'fib') opts = q.options || q.choices
      else if (q.type === 'tf') opts = ['True', 'False']
      if (opts) {
        const letters = optionLetters(opts.length)
        opts.forEach((o, k) => text(`${letters[k]}. ${o}`, { size: 10, color: '#475069', indent: 12, gap: 1 }))
        text('', { gap: 2 })
      }
      const answer = q.type === 'id' || q.type === 'short'
        ? q.answer
        : q.type === 'tf'
          ? String(q.answer)
          : q.type === 'multi'
            ? (q.answerIndices || []).map(k => 'ABCDEFGH'[k]).filter(x => x).join(' · ')
            : q.type === 'matching'
              ? (q.pairs || []).map((p, k) => `${'ABCDEFGH'[k]}. ${p.right}`).join(' · ')
            : q.type === 'ordering'
              ? (q.steps || []).map((s, k) => `${k + 1}. ${s}`).join(' → ')
              : 'ABCDEFGH'[q.answerIndex] + '. ' + ((q.options ?? q.choices)?.[q.answerIndex] ?? '')
      text(`Answer: ${answer ?? '(ungraded)'}`, { size: 10, bold: true, color: '#0f9d6a', indent: 12, gap: 8 })
    }
  }

  rule()
  text(`Generated ${stamp()} · exported from Quizard`, { size: 9, color: '#868ea8' })

  pdf.save(`quizard-exam-${slug(exam.title)}.pdf`)
  return true
}

export function exportQuiz(docName, lastResult) {
  if (!lastResult?.questions?.length) return false
  download(`quizard-quiz-${slug(docName)}.md`, buildQuizMarkdown(docName, lastResult.questions, lastResult.review))
  return true
}

export function printStudySheet(doc) {
  const summary = summarizeDoc(stripSlideMarkers(doc.text))
  const sections = summary.sections.map(sec =>
    `<h2>${escHtml(sec.title)}</h2><ul>${sec.points.map(p => `<li>${escHtml(p)}</li>`).join('')}</ul>`
  ).join('')
  const tldr = summary.tldr.length
    ? `<h2>Key pointers</h2><ul>${summary.tldr.map(p => `<li>${escHtml(p)}</li>`).join('')}</ul>`
    : ''
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(doc.name)}</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#10162e;line-height:1.6}
      h1{font-size:22px} h2{font-size:16px;margin-top:22px;color:#5b3df5} ul{margin:6px 0} li{margin:3px 0}
      .meta{color:#868ea8;font-size:13px} hr{border:none;border-top:1px solid #e4e9f2;margin:18px 0}
    </style></head><body>
    <h1>${escHtml(doc.name)}</h1><p class="meta">Pointers to review · ${(doc.wordCount || 0).toLocaleString()} words · exported from Quizard</p>
    ${tldr}${sections}
    <hr><p class="meta">Generated ${stamp()}</p>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}


function roman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, r] of map) { while (n >= v) { out += r; n -= v } }
  return out
}
function slug(name) {
  return String(name || 'doc').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'doc'
}

function escHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// ── Teacher app exports (PLAN.md Phase 2): quiz paper, teacher key, bubble sheets ──

// Pure geometry for the printable bubble sheet: two balanced columns of A–D
// rows inside the frame (single column for very short quizzes). Exported for
// unit tests and reused by the Phase 3 scanner to locate bubbles.
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
    letters: ['A', 'B', 'C', 'D']
  }
}

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

const BUBBLE = { W: 612, H: 792, M: 40, circleR: 6.5, pitch: 22, colGap: 24 }

function headerBlock(pdf, quiz, subtitle) {
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#7c3aed')
  pdf.text('Q U I Z A R D', BUBBLE.M, BUBBLE.M + 6)
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor('#1c2438')
  const title = pdfSafe(quiz.subject + (quiz.title ? ' — ' + quiz.title : ''))
  pdf.text(title, BUBBLE.M, BUBBLE.M + 26)
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor('#6b7280')
  pdf.text(pdfSafe(subtitle), BUBBLE.M, BUBBLE.M + 40)
}

// Shared scaffold for the quiz paper and the teacher's key copy.
export async function exportTeacherQuizPdf(quiz, { withAnswers = false } = {}) {
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

  pdf.save(`quizard-${withAnswers ? 'key' : 'quiz'}-${slug(quiz.subject || quiz.title)}.pdf`)
}

// The scannable answer sheet: frame, corner markers, QR (quiz id), two-column
// A–D bubble grid, and the write-in fields the teacher asked for.
export async function exportBubbleSheets(quiz, copies = 1) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  const { W, H, M, circleR, pitch } = BUBBLE
  const layout = bubbleSheetLayout(quiz.items.length)

  for (let copy = 0; copy < Math.max(1, Math.min(60, copies)); copy++) {
    if (copy > 0) pdf.addPage()

    headerBlock(pdf, quiz, 'Shade ONE circle per row fully with pen or pencil.')

    // frame + corner markers
    const fx = 130, fy = M + 52, fw = W - fx - M, fh = layout.rows * pitch + 46
    pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1.6)
    pdf.rect(fx, fy, fw, fh, 'S')
    pdf.setFillColor('#0b0820')
    const mk = 10, inset = 6
    for (const [cx, cy] of [[fx + inset, fy + inset], [fx + fw - inset - mk, fy + inset], [fx + inset, fy + fh - inset - mk], [fx + fw - inset - mk, fy + fh - inset - mk]]) {
      pdf.rect(cx, cy, mk, mk, 'F')
    }

    // QR (identifies the quiz/key at scan time)
    bubbleQr(pdf, `QZ1:${quiz.id}`, fx + fw - 108, fy + fh - 108, 92)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor('#6b7280')
    pdf.text('Do not write inside the QR code', fx + fw - 108, fy + fh - 12)

    // bubble grid
    const gridTop = fy + 26
    const colX = i => fx + 22 + i * ((fw - 40) / (layout.single ? 1 : 2))
    let idx = 0
    layout.columns.forEach((col, ci) => {
      for (let r = 0; r < col.count; r++) {
        const n = col.start + r
        const item = quiz.items[idx]
        const qy = gridTop + r * pitch
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#374151')
        pdf.text(String(n), colX(ci), qy + 4)
        for (let b = 0; b < 4; b++) {
          const bx = colX(ci) + 26 + b * (circleR * 2 + 10) + circleR
          pdf.setDrawColor('#0b0820'); pdf.setLineWidth(1)
          pdf.circle(bx, qy, circleR, 'S')
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor('#9ca3af')
          pdf.text(layout.letters[b], bx, qy + 2, { align: 'center', baseline: 'middle' })
        }
        idx++
      }
    })

    // write-in fields below the frame
    const by = fy + fh + 34
    pdf.setFontSize(10); pdf.setTextColor('#1c2438')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Student Name:', M, by)
    pdf.setFont('helvetica', 'normal')
    pdf.line(M + 78, by + 2, W / 2 - 14, by + 2)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Date:', W / 2, by)
    pdf.setFont('helvetica', 'normal')
    pdf.line(W / 2 + 30, by + 2, W / 2 + 130, by + 2)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Grade & Section:', M, by + 24)
    pdf.setFont('helvetica', 'normal')
    pdf.line(M + 90, by + 26, W / 2 + 60, by + 26)
  }

  pdf.save(`quizard-bubble-sheets-${slug(quiz.subject || quiz.title)}.pdf`)
}
