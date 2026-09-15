// Pure prompt builders for the ai quiz generator. No browser/runtime deps so
// they can be unit-tested and exercised by the standalone distractor test.

export const MCQ_RULES = [
  'You are an exam writer. Create exam questions STRICTLY from the study content given below.',
  'Ground every question ONLY in its source sentence. Never invent facts.',
  'NEVER reference, quote, or ask about document titles, section headings, chapter names, unit numbers, page numbers, figure/table lists, or a table of contents.',
  'Write like a professional exam paper: each item is ONE direct, specific multiple-choice question of exactly the kind a teacher prints on a test — "What is the primary purpose of an operating system?", "Which of the following is a programming language?", "What does CPU stand for?", "Which protocol is commonly used to access web pages?".',
  '  - Ask WHAT something is, WHY it matters, HOW it works, or WHICH option fits. Name the subject of the question explicitly so the question is unambiguous.',
  '  - The stem may paraphrase and reword the source sentence — do NOT copy it verbatim.',
  '  - NEVER write a fill-in-the-blank, never write "Complete the statement:", and never put a blank (____) in the stem.',
  '  - Exactly ONE option is the best answer; the question must be answerable from the source sentence alone.',
  'The four options are the most important part of the question:',
  '  - Give exactly 4 options in total: "correct" (the best answer) plus exactly 3 "wrong" options.',
  '  - Every option must be a SHORT, concrete phrase — 2 to 8 words (about 60 characters maximum), like the choices on a printed exam ("To browse the internet", "Python", "Central Processing Unit").',
  '  - NEVER write a full sentence as an option, and never mix a one-word option with a long phrase.',
  '  - Each wrong option must be a SPECIFIC, believable answer a student could realistically confuse with the correct one.',
  '  - Each wrong option must belong to the SAME subject/topic as the source sentence. Do NOT use generic, out-of-domain, absurd, or joke options.',
  '  - You are given "related terms from this document" for each item — these are real concepts drawn from the source material. Use them as wrong options whenever possible; they must be specific to THIS document, never generic or invented.',
  '  - Never use filler such as "none of the above", "all of the above", "option 1/2/3", "I don\'t know", placeholders, or the word "example".',
  '  - None of the wrong options may equal or contain the correct answer.',
  '  - Make all four options PARALLEL in length and form, like a teacher would list them on an exam (roughly 2-8 words each). Keep no option dramatically longer or shorter than the others.',
  '  - The wrong options should be PLAUSIBLE and distinct from one another (not near-duplicates or synonyms of each other), so a student must actually reason rather than spot the odd one out.',
  '  - When the question is about a procedure, rule, or best practice ("What is the best way to…"), rank real alternatives from the document: the correct option states the recommended practice, the wrong options state practices that are less effective, outdated, or misread from the same material.',
  'Reply ONLY with a JSON array. Every item uses "i" (the index) and "kind":"mcq", plus "stem" (the direct question), "correct" (the full text of the best option) and "wrong" (exactly 3 short wrong options). Include every index. Example: [{"i":0,"kind":"mcq","stem":"What is the primary purpose of an operating system?","correct":"To manage computer hardware and software resources","wrong":["To browse the internet","To edit images","To create presentations"]}]'
].join('\n')

// Rules for identification clues (kept separate for reuse).
export const ID_RULES = [
  'For id: write ONE clue of max 25 words describing the given answer without using it or close variants of it.',
  'Never include the answer term, its synonyms, or the document title/section in the clue.'
].join('\n')

// Image questions: the document's slides/figures are attached as images. The
// model writes multiple-choice questions that require seeing a specific image,
// referencing it by its 0-based position in the attached list.
export const IMAGE_RULES = [
  'You are an exam writer for a study app. The student uploaded a document; several of its slides or figures are attached as images.',
  'For each image you can interpret, write ONE multiple-choice question that genuinely requires seeing that image (a diagram, chart, map, graph, photo, or labelled figure).',
  'Reference the image naturally ("According to the diagram…", "What does this figure show?") — NEVER name the document title, section heading, chapter, or slide number.',
  'Return a JSON array (possibly empty). Each item: {"imageIndex":<0-based position of the image in the attached list>,"stem":"...","correct":"<the right answer>","wrong":["...","...","..."]}.',
  'The 3 wrong options must be SPECIFIC and belong to the same subject as the image content. Never use filler ("none of the above", "option 1", "I don\'t know"), jokes, or out-of-domain facts.',
  'Keep the 4 options parallel in length and form (short phrases of similar size, like a teacher would write on an exam), and make the wrong options plausible and distinct from each other.',
  'Only return items for images you can actually interpret. Skip blank, decorative, or unreadable images.',
  'Reply ONLY with the JSON array.'
].join('\n')

export function mcqPrompt(items, relatedFor, weakHint) {
  const lines = items.map(([q, i]) => {
    let kind
    if (q.type === 'mcq') kind = 'mcq'
    else if (q.type === 'id') kind = 'id'
    else if (q.type === 'short') kind = 'short'
    else return null
    const base = `${i} [${kind}] source sentence: "${q.meta.sentence}" | correct answer: "${q.meta.term}"`
    if (relatedFor) {
      const rel = relatedFor(q)
      if (rel && rel.length) return `${base} | related terms from this document: ${rel.join(', ')}`
    }
    return base
  }).filter(Boolean)
  let prompt = MCQ_RULES + '\n\nItems:\n' + lines.join('\n')
  if (weakHint) prompt += '\n\n' + weakHint
  return prompt
}

// Grade a learner's free-text short answer against the reference. Returns a
// JSON object {"ok":true|false}.
export const SHORT_GRADE_RULES = [
  'You are a strict but fair grader. Compare the student\'s answer to the reference answer for the question.',
  'Accept the student answer as correct when it means the same thing as the reference (same key term or synonym, minor spelling/wording differences allowed, extra words allowed as long as the core idea matches).',
  'Reject when it names the wrong concept, is blank, or is unrelated.',
  'Reply ONLY with a JSON object: {"ok":true} or {"ok":false}.'
].join('\n')

export function shortGradePrompt({ prompt, answer, userAnswer }) {
  return SHORT_GRADE_RULES + '\n\n' + JSON.stringify({ question: prompt, referenceAnswer: answer, studentAnswer: userAnswer })
}

// After a student answers, the model explains why the correct answer is right
// (and, when they were wrong, why their choice was not). Plain text, short.
export const EXPLAIN_RULES = [
  'You are a patient tutor. A student just answered a study question.',
  'Explain in 2-3 short sentences WHY the correct answer is right, and — only if the student was wrong — WHY their chosen answer is not correct.',
  'Be specific and refer to the subject matter. No preamble, no headings, plain text only.',
  'Reply ONLY with a JSON object: {"explanation":"..."}.'
].join('\n')

export function explainPrompt({ stem, options, correctAnswer, userAnswer }) {
  const payload = { question: stem, correctAnswer }
  if (Array.isArray(options) && options.length) payload.options = options
  payload.userAnswer = userAnswer == null ? null : userAnswer
  return EXPLAIN_RULES + '\n\n' + JSON.stringify(payload)
}

// Gemini (multimodal) analyzes page/figure images from a document and returns a
// structured description of each one. This is the "Gemini sees once" step — its
// output is cached on the doc and reused, so the cheaper GLM does the actual
// question authoring. Each record references the 0-based position of its image.
export const DOC_VISUAL_RULES = [
  'You are a meticulous document analyst for a study app. Several images from a document are attached, each labelled by its 0-based position in the list.',
  'For every image that shows MEANINGFUL study content, return one record describing it:',
  '  - imageIndex: the 0-based position of that image in the attached list',
  '  - page: the page/slide number visible in the image (infer from any footer/header label; otherwise use the image index + 1)',
  '  - kind: one of "code" | "diagram" | "chart" | "table" | "figure" | "equation"',
  '  - label: a short 2-6 word title of what it shows',
  '  - content: for "code"/"equation" reproduce the text EXACTLY as shown; for other kinds give a concise factual description (what is depicted, key labels, values, trends).',
  'Skip decorative, blank, low-content, or unreadable images. Return ONLY a JSON array (possibly empty).'
].join('\n')

// GLM (text-only) authors the actual quiz questions from the cached analysis.
// It receives the structured elements (with imageIndex/page/kind/label/content)
// and may attach a question to a specific element via imageIndex.
export const VISUAL_Q_RULES = [
  'You are an exam writer. Write multiple-choice quiz questions grounded in the provided visual element analysis of a study document.',
  'Each element has imageIndex, page, kind, label and content (verbatim for code/equations, described for others).',
  'Write ONE direct, specific question that requires understanding the element when that adds value. For a code element ask for its OUTPUT, RESULT, or BEHAVIOUR. For a diagram/chart/table ask what it shows, illustrates, or implies.',
  'Every question is multiple choice with EXACTLY 4 options: "correct" plus exactly 3 specific, on-topic, filler-free "wrong" options.',
  '  - Each option is a SHORT, concrete phrase of 2 to 8 words (about 60 characters maximum) — never a full sentence.',
  '  - Keep the 4 options PARALLEL in length and form (short phrases of similar size, like a teacher would write on an exam), and make the wrong options plausible and distinct from each other.',
  '  - Never write a fill-in-the-blank or "Complete the statement:" stem — ask a direct question instead.',
  'When the question depends on seeing the visual, set "imageIndex" to that element\'s index; otherwise omit it.',
  'Never mention the document title, chapter, section heading, or slide/page number in the wording.',
  'Reply ONLY with a JSON array of objects: {"imageIndex":N,"kind":"mcq","stem":"...","correct":"...","wrong":["...","...","..."]}.'
].join('\n')

export function visualQuestionPrompt(elements, weakHint) {
  const lines = elements.map(el => `  [${el.imageIndex}] page ${el.page} (${el.kind}) ${el.label}: ${el.content}`)
  let prompt = VISUAL_Q_RULES + '\n\nVisual elements found in the document:\n' + lines.join('\n')
  if (weakHint) prompt += '\n\n' + weakHint
  return prompt
}

// Exam-prep wizard chat. The model receives the conversation plus a digest of
// the user's library and must reply conversationally AND return structured
// state so the app can track exam coverage.
export const EXAM_CHAT_RULES = [
  'You are the Quizard Exam Wizard — a warm, slightly theatrical old wizard mentor helping a student prepare for an upcoming exam.',
  'The student tells you about an exam (announcement, subjects, date). You check their library digest and guide them to cover every announced topic.',
  'Rules:',
  '  - Only reference documents that appear in the library digest. NEVER invent or assume files that are not listed.',
  '  - For each topic the exam covers, check whether a digest document covers it (compare titles, topics and key terms).',
  '  - If a topic has no matching document, tell the student exactly what kind of file to upload next and add it to missingTopics.',
  '  - If a document matches a topic, add its id to matchedDocIds and mention it by name in your reply.',
  '  - Keep replies short and conversational (2-5 sentences). Address the student directly.',
  '  - Set examTitle when you can infer it, examDate only if the student stated one (ISO date or null).',
  '  - Set readyToCreate to true ONLY when every announced topic is covered by at least one uploaded document and matchedDocIds is non-empty.',
  'Reply ONLY with a JSON object:',
  '{"reply":"...","examTitle":"..."|null,"examDate":"YYYY-MM-DD"|null,"topics":[{"title":"...","reason":"why it may appear"}],"matchedDocIds":["..."],"missingTopics":["..."],"readyToCreate":true|false}'
].join('\n')

export function examChatPrompt(conversation, digest, draft) {
  const lines = conversation.map(m => `${m.role === 'user' ? 'Student' : 'Wizard'}: ${m.text}`)
  const docs = digest.map(d =>
    `  - id: ${d.id}\n    name: ${d.name} (${d.type})\n    topics: ${d.topics.join(', ') || 'none detected'}\n    key terms: ${d.keyTerms.join(', ') || 'none'}`
  ).join('\n')
  let prompt = EXAM_CHAT_RULES +
    '\n\nStudent\'s library:\n' + docs +
    '\n\nConversation so far:\n' + lines.join('\n')
  if (draft?.topics?.length) {
    prompt += '\n\nCurrent exam draft topics:\n' + draft.topics.map(t => `  - ${t.title}${t.reason ? ' (' + t.reason + ')' : ''}`).join('\n')
  }
  return prompt
}

// One batched call fetches a one-line explanation for every question in a
// quiz right after generation, so feedback can show it without a extra tap.
export const EXPLAIN_BATCH_RULES = [
  'You are a patient tutor. For each numbered study question, write ONE short sentence explaining why the given answer is correct.',
  'Use only the question and answer given — never invent facts beyond them.',
  'Plain text, no markdown, at most 140 characters each.',
  'Reply ONLY with strict JSON: {"explanations":[{"i":0,"text":"..."}]} using the same i numbers.'
].join('\n')

export function explainBatchPrompt(items) {
  return EXPLAIN_BATCH_RULES + '\n\n' + JSON.stringify({
    questions: items.map((q, i) => ({
      i,
      type: q.type,
      question: String(q.stem || q.statement || q.clue || q.prompt || '').slice(0, 300),
      answer: String(q.answer ?? q.options?.[q.answerIndex] ?? q.choices?.[q.answerIndex] ?? '').slice(0, 200)
    }))
  })
}

// Full AI authoring: instead of polishing built-in drafts, the model authors
// original exam-style questions straight from numbered source sentences.
// Each item cites its source sentence ("src") so the caller can validate the
// grounding; validators + the heading ban list keep it honest.
export const AUTHOR_RULES = [
  'You are an exam writer. Author ORIGINAL exam questions STRICTLY grounded in the numbered source sentences below.',
  'For EACH numbered source sentence, write ONE exam-style question a teacher would put on a real test.',
  'Ask WHAT something is, WHY it matters, HOW it works, or WHICH option fits — direct, specific, unambiguous questions of the kind a teacher prints on a test: "What is the primary purpose of an operating system?", "Which of the following is a programming language?", "What does CPU stand for?".',
  'Never write a fill-in-the-blank, never write "Complete the statement:", and never put a blank (____) in the stem.',
  'Ground every question ONLY in its own source sentence — never invent facts, and never blend material from other sentences.',
  'Each item MUST cite its source: "src" is the number of the sentence it is based on.',
  'Every question is multiple choice: "stem" (the direct question), "correct" (the best answer) and "wrong" (exactly 3 wrong options).',
  '  - Each option is a SHORT, concrete phrase of 2 to 8 words (about 60 characters maximum) — never a full sentence.',
  '  - Keep all four options parallel in length and grammar, and make the wrong options specific, believable, on-topic and distinct from each other.',
  'Never use filler ("none of the above", "option 1", "I don\'t know") or out-of-domain options.',
  'NEVER reference the document title, section headings, chapter names, unit numbers, or page numbers.',
  'Skip any sentence that cannot support a good question — fewer good questions beat more bad ones.',
  'Reply ONLY with a JSON array: [{"src":0,"kind":"mcq","stem":"What is the primary purpose of an operating system?","correct":"To manage computer hardware and software resources","wrong":["To browse the internet","To edit images","To create presentations"]}]'
].join('\n')

export function authorQuizPrompt(group, weakHint) {
  const lines = group.map(s => `[${s.i}] ${s.text}`).join('\n')
  let prompt = AUTHOR_RULES + '\n\nSource sentences:\n' + lines
  if (weakHint) prompt += '\n\n' + weakHint
  return prompt
}
