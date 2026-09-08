import { listMistakes, getDoc, listDueCards, getWeakTerms, listDocs } from '../lib/storage.js'
import { keyTerms } from '../lib/textproc.js'
import { buildMistakeQuestions, generateQuiz } from '../lib/quizgen.js'

export async function startMistakeReview(ctx, docId = null) {
  const mistakes = await listMistakes(docId)
  if (!mistakes.length) {
    ctx.toast('No mistakes to review — great job! 🎉')
    return
  }
  const docIds = [...new Set(mistakes.map(m => m.docId))]
  const docTerms = new Map()
  for (const id of docIds) {
    const doc = await getDoc(id)
    docTerms.set(id, doc ? keyTerms(doc.text) : [])
  }
  const questions = buildMistakeQuestions(mistakes, docTerms)
  if (!questions.length) {
    ctx.toast('Could not build review questions')
    return
  }
  ctx.state.mistakeReview = {
    questions,
    docName: docId ? null : `All documents (${docIds.length})`
  }
  ctx.go('quiz')
}

// Review only the cards whose srs schedule says they are due now.
export async function startDueReview(ctx) {
  const due = await listDueCards(30)
  if (!due.length) {
    ctx.toast('Nothing due — come back later!')
    return
  }
  const docIds = [...new Set(due.map(m => m.docId))]
  const docTerms = new Map()
  for (const id of docIds) {
    const doc = await getDoc(id)
    docTerms.set(id, doc ? keyTerms(doc.text) : [])
  }
  const questions = buildMistakeQuestions(due, docTerms)
  if (!questions.length) {
    ctx.toast('Could not build review questions')
    return
  }
  ctx.state.mistakeReview = {
    questions,
    docName: `Spaced review (${due.length} due)`
  }
  ctx.go('quiz')
}

// Review the learner's weakest terms first: rank every banked mistake and due
// card by how often its term has been missed, then build a review session that
// leads with the highest-frequency problem terms.
export async function startWeakReview(ctx) {
  const weak = await getWeakTerms(null)
  if (!weak.length) {
    ctx.toast('No weak spots yet — take a few quizzes first')
    return
  }
  const rank = new Map(weak.map(w => [String(w.term).toLowerCase(), w.count || 1]))
  const [mistakes, due] = await Promise.all([listMistakes(null), listDueCards(60)])
  const items = [...mistakes, ...due]
  if (!items.length) {
    ctx.toast('No weak-spot questions to review yet')
    return
  }
  items.sort((a, b) =>
    (rank.get(String(a.term).toLowerCase()) || 0) - (rank.get(String(b.term).toLowerCase()) || 0))
  const seen = new Set()
  const chosen = []
  for (const it of items) {
    const k = String(it.term).toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    chosen.push(it)
    if (chosen.length >= 30) break
  }
  const docIds = [...new Set(chosen.map(m => m.docId))]
  const docTerms = new Map()
  for (const id of docIds) {
    const doc = await getDoc(id)
    docTerms.set(id, doc ? keyTerms(doc.text) : [])
  }
  const questions = buildMistakeQuestions(chosen, docTerms)
  if (!questions.length) {
    ctx.toast('Could not build review questions')
    return
  }
  ctx.state.mistakeReview = {
    questions,
    docName: `Weak spots (${chosen.length} terms)`
  }
  ctx.go('quiz')
}

// Master review: one interleaved session across ALL documents — due spaced
// repetition cards first, then fresh questions round-robined across every
// document, then unresolved mistakes. The full-study mixed review.
export async function startMasterReview(ctx) {
  const metas = await listDocs()
  if (!metas.length) {
    ctx.toast('Add a document first — nothing to master yet')
    return
  }
  const docs = []
  for (const m of metas.slice(0, 6)) {
    const d = await getDoc(m.id)
    if (d && d.text) docs.push(d)
  }
  const [mistakes, due] = await Promise.all([listMistakes(null), listDueCards(60)])
  const docTerms = new Map()
  for (const d of docs) docTerms.set(d.id, keyTerms(d.text))

  const questions = []
  if (due.length) {
    questions.push(...buildMistakeQuestions(due.slice(0, 8), docTerms))
  }
  // Fresh questions per document, tagged for mistake banking, round-robined
  // so the session interleaves documents instead of blocking them.
  const perDoc = 3
  const pools = docs.map(d => {
    const r = generateQuiz(d, {
      count: perDoc,
      mix: { mcq: true, tf: true, fib: true, id: true },
      difficulty: 'medium',
      shuffle: true
    })
    return (r.questions || []).map(q => ({
      ...q,
      meta: { ...(q.meta || {}), docId: d.id }
    }))
  })
  for (let i = 0; i < perDoc; i++) {
    for (const pool of pools) {
      if (pool[i]) questions.push(pool[i])
    }
  }
  const seenSentences = new Set(questions.map(q => q.meta?.sentence))
  const banked = mistakes.filter(m => !seenSentences.has(m.sentence))
  if (banked.length) {
    questions.push(...buildMistakeQuestions(banked.slice(0, 8), docTerms))
  }
  const final = questions.slice(0, 25)
  if (!final.length) {
    ctx.toast('Nothing to review yet — take a quiz first')
    return
  }
  ctx.state.mistakeReview = {
    questions: final,
    docName: `Master review (${docs.length} document${docs.length === 1 ? '' : 's'})`
  }
  ctx.go('quiz')
}
