let pdfjsLib = null
let workerSet = false

export async function extractPdf(file) {
  // Lazily load pdf.js only when a PDF is actually imported (keeps it out of
  // the initial bundle so the app starts fast).
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    // Absolute URL: pdf.js's fake-worker fallback does import(workerSrc), and a
    // bare specifier like 'pdf.worker.min.mjs' can't be resolved there — the
    // Worker constructor would tolerate it, but the fallback path errors out
    // with "Failed to resolve module specifier". Also lets the service worker
    // serve the precached file when the origin is unreachable.
    const workerUrl = new URL('pdf.worker.min.mjs', document.baseURI).href
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
    workerSet = true
  }
  const buf = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({
    data: buf,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true
  })
  const doc = await loadingTask.promise

  const pages = []
  const total = doc.numPages
  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let pageText = ''
    for (const item of content.items) {
      if (!item.str) continue
      if (pageText && !pageText.endsWith(' ') && !item.str.startsWith(' ')) pageText += ' '
      pageText += item.str
      if (item.hasEOL) pageText += '\n'
    }
    // keep the real page index so the text can be labeled downstream
    if (pageText.trim()) pages.push({ num: i, text: pageText.trim() })
    page.cleanup()
  }
  await loadingTask.destroy()

  // Label every page so downstream AI/chunking can see the document structure
  // (textproc.splitSlideSections parses these markers).
  const text = pages.map(p => `=== Page ${p.num} ===\n${p.text}`).join('\n\n')
  if (!text.trim()) {
    throw new Error('No selectable text found. This PDF may be a scanned image.')
  }
  return `PDF document, ${total} page${total > 1 ? 's' : ''}.\n\n` + text
}
