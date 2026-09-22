/**
 * Teacher-quality question stem and distractor generation.
 * Converts document sentences into proper MCQ questions and picks
 * same-category distractors based on co-occurrence and morphological class.
 */

import { words, mulberry32, shuffleArr } from './textproc.js'

/* ── Morphological categories for distractor grouping ── */

const SUFFIX_CLASSES = [
  { re: /(?:tion|sion|ment|ism|ity|ness|ance|ence|ure|age)$/, cls: 'abstract' },
  { re: /(?:ase|osis|esis|plasty|lysis)$/, cls: 'process' },
  { re: /(?:ology|onomy|ics)$/, cls: 'field' },
  { re: /(?:er|or|ist|ant|ent|ee)$/, cls: 'agent' },
]

const ADJ_SUFFIX = /(?:ic|ical|al|ive|ous|ful|ish|ary|ent|ant|able|ible|ar)$/i

/**
 * Guess a morphological class for a term (used to group plausible distractors).
 * @param {{ term: string, phrase?: boolean, proper?: boolean }} t
 * @returns {string} e.g. 'abstract', 'process', 'proper', 'phrase', 'plural', 'plain'
 */
export function termClass(t) {
  if (t.phrase) return 'phrase'
  if (t.proper) return 'proper'
  const w = t.term
  if (t.phrase || /\s/.test(w)) return 'phrase'
  if (t.proper) return 'proper'
  if (ADJ_SUFFIX.test(w)) return 'adj'
  // Check suffix classes first (processes, enzymes, etc.) before plural
  for (const rule of SUFFIX_CLASSES) {
    if (rule.re.test(w)) return rule.cls
  }
  if (/[^s]s$/.test(w)) return 'plural'
  return 'plain'
}

/* ── Co-occurrence map ── */

/**
 * Build a term→{term→count} co-occurrence map from sentences.
 * Two terms co-occur when they appear in the same sentence.
 */
export function buildCooccurrence(sents, terms) {
  const reMap = terms.map(t => ({
    ...t,
    re: new RegExp('\\b' + t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
  }))
  const co = new Map()
  for (const s of sents) {
    const present = reMap.filter(t => t.re.test(s))
    for (let i = 0; i < present.length; i++) {
      const a = present[i].term
      if (!co.has(a)) co.set(a, new Map())
      const m = co.get(a)
      for (let j = 0; j < present.length; j++) {
        if (i === j) continue
        const b = present[j].term
        m.set(b, (m.get(b) || 0) + 1)
      }
    }
  }
  return co
}

/* ── Option formatting ── */

/**
 * Format an MCQ option consistently (capitalized, trimmed, no trailing punctuation).
 */
export function formatOption(s) {
  let t = s.trim().replace(/[.!?…,;:]+$/, '')
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/* ── Improved distractor selection ── */

/**
 * Pick distractor terms that are topically and morphologically similar to the answer.
 * @param {{ term: string, freq?: number, phrase?: boolean, proper?: boolean }} answer
 * @param {{ term: string, freq: number, phrase?: boolean, proper?: boolean }[]} allTerms
 * @param {() => number} rng
 * @param {number} count
 * @param {{ avoidSentence?: string, cooccur?: Map<string, Map<string, number>> }} [opts]
 * @returns {string[]}
 */
export function pickDistractors(answer, allTerms, rng, count = 3, opts = {}) {
  const target = answer.term
  const avoidSentence = opts.avoidSentence || ''
  const coMap = opts.cooccur?.get(target)

  const targetClass = termClass(answer)
  const targetShape = target.split(/[\s-]+/).length

  const avoidRe = avoidSentence
    ? new RegExp('\\b' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
    : null
  const targetInAvoid = avoidRe && avoidRe.test(avoidSentence)

  // Score each candidate
  const scored = []
  for (const cand of allTerms) {
    if (cand.term === target) continue
    // Skip if candidate term appears in the question sentence
    if (avoidSentence) {
      const cRe = new RegExp('\\b' + cand.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
      if (cRe.test(avoidSentence)) continue
    }
    // Skip substring overlaps (e.g. "chemical" vs "chemical energy")
    const a = target.toLowerCase(), b = cand.term.toLowerCase()
    if (a.includes(b) || b.includes(a)) continue

    let score = 0
    // Co-occurrence bonus: terms that appear in same sentences as answer
    if (coMap) score += (coMap.get(cand.term) || 0) * 4

    // Same morphological class bonus
    if (termClass(cand) === targetClass) score += 2

    // Same word-count shape (strong teacher heuristic)
    const candShape = cand.term.split(/[\s-]+/).length
    if (candShape === targetShape) score += 2
    else if (Math.abs(candShape - targetShape) === 1) score += 1

    // Length proximity bonus
    score -= Math.abs(cand.term.length - target.length) * 0.08

    // Jitter: slight random tiebreaker for variety
    score += rng() * 0.5

    scored.push({ term: cand.term, score })
  }

  scored.sort((a, b) => b.score - a.score)
  // Plausibility guard: reject near-duplicates and containment overlaps
  // between the chosen distractors themselves, so options stay distinct.
  const picked = []
  for (const s of scored) {
    if (picked.length >= count) break
    const t = s.term.toLowerCase()
    const clash = picked.some(p => {
      const l = p.toLowerCase()
      if (l.includes(t) || t.includes(l)) return true
      // Same word stem ("photosynthesis" / "photosynthetic") reads as a dupe.
      return l.slice(0, 5) === t.slice(0, 5) && Math.abs(l.length - t.length) <= 4
    })
    if (!clash) picked.push(s.term)
  }
  return picked
}

/* ── Source casing + acronyms (exam-style fallback quality) ── */

/**
 * Find the original casing of a (lowercased) term in the source text.
 * Key terms are stored lowercase, which mangles acronyms/agency names
 * ("cicc" → "Cicc"). The most frequent original surface form wins; ties
 * prefer the form with more uppercase letters.
 * @param {string} term - Lowercased term
 * @param {string} text - Source document text
 * @returns {string|null} Best original-casing form, or null when absent
 */
export function restoreCasing(term, text) {
  if (!term || !text) return null
  let re
  try {
    re = new RegExp('\\b' + escapeRe(term) + '\\b', 'gi')
  } catch { return null }
  const counts = new Map()
  let m, guard = 0
  while ((m = re.exec(text)) !== null && guard++ < 40) {
    const form = m[0]
    counts.set(form, (counts.get(form) || 0) + 1)
    if (m[0].length === 0) re.lastIndex++
  }
  if (!counts.size) return null
  const caps = s => (s.match(/[A-Z]/g) || []).length
  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || (caps(b[0]) - caps(a[0])))
    .map(e => e[0])[0]
}

/**
 * Surface an option the way a teacher prints it: acronyms and proper nouns
 * keep their source casing ("CICC", "PNP-ACG", "RA 10175"), common words are
 * capitalized ("Sunlight").
 */
export function surfaceOption(term, text) {
  const hit = restoreCasing(String(term || ''), text || '')
  if (hit) {
    const t = hit.trim().replace(/[.!?…,;:]+$/, '')
    if (!t) return formatOption(term)
    if (/[A-Z]/.test(t.slice(1))) return t
    return formatOption(t)
  }
  return formatOption(term)
}

const ABBR_RE = /^[A-Z][A-Z0-9-]{1,7}$/

function cleanExpansion(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[.;:,]+$/, '')
}

function validExpansion(exp, abbr) {
  if (!exp || !abbr) return false
  if (!ABBR_RE.test(abbr)) return false
  if ((abbr.match(/[A-Z]/g) || []).length < 2) return false
  const wc = exp.split(/\s+/).length
  if (wc < 2 || wc > 8) return false
  if (exp.length > 90) return false
  const titled = exp.split(/\s+/).filter(w => /^[A-Z]/.test(w)).length
  if (titled < 2) return false
  if (new RegExp('\\b' + escapeRe(abbr) + '\\b').test(exp)) return false
  return true
}

/**
 * Detect acronym definitions in source text:
 * "Cybercrime Investigation and Control Center (CICC)" and the reverse
 * "CICC (Cybercrime Investigation and Control Center)".
 * @param {string} text
 * @returns {Array<{abbr: string, expansion: string}>}
 */
export function findAcronyms(text) {
  const out = []
  const seen = new Set()
  const src = String(text || '')
  if (!src) return out
  const push = (abbr, exp) => {
    const expansion = cleanExpansion(exp)
    abbr = String(abbr || '').trim()
    if (!validExpansion(expansion, abbr)) return
    if (seen.has(abbr)) return
    seen.add(abbr)
    out.push({ abbr, expansion })
  }
  let m
  const fwd = /([A-Z][A-Za-z0-9&'’-]*((\s+(?:of|the|for|and|on|de|del|sa|ng)?\s*)[A-Z][A-Za-z0-9&'’-]*)+)\s+\(([A-Z][A-Z0-9-]{1,7})\)/g
  while ((m = fwd.exec(src)) !== null && out.length < 20) push(m[4], m[1])
  const rev = /\b([A-Z][A-Z0-9-]{1,7})\s+\(([A-Z][^)]{3,80})\)/g
  while ((m = rev.exec(src)) !== null && out.length < 20) push(m[1], m[2])
  return out
}

/**
 * Direct exam stem for an acronym ("What does CICC stand for?").
 */
export function buildAcronymStem(abbr) {
  return { stem: `What does ${abbr} stand for?`, style: 'acronym' }
}

/* ── Sentence pattern detection ── */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Try to extract a subject-predicate pair from a sentence containing `term`.
 * Returns { verb, predicate, style } where:
 * - style: 'copula' (X is/are Y), 'action' (X does Y), or null (no pattern).
 */
export function splitSubject(sentence, term) {
  const esc = escapeRe(term)
  const core = sentence.trim()

  // Copula: "Term is/are/was/were the predicate."
  let m = core.match(new RegExp('^(?:the\\s+|a\\s+|an\\s+)?' + esc + '\\s+(is|are|was|were)\\s+(.+)$', 'i'))
  if (m) {
    const predicate = m[2].replace(/[.!?…]+$/, '').trim()
    return { verb: m[1], predicate, style: 'copula' }
  }

  // Action verb: "Term VERBS predicate." e.g. "Photosynthesis converts light energy..."
  m = core.match(new RegExp('^(?:the\\s+|a\\s+|an\\s+)?' + esc + '\\s+([a-z]+(?:s|ed|es|ies|s)?|can|will|shall|may|must|should|could|would|does|do)\\s+(.+)$', 'i'))
  if (m) {
    const verb = m[1]
    const predicate = m[2].replace(/[.!?…]+$/, '').trim()
    if (verb && predicate) return { verb, predicate, style: 'action' }
  }

  return null
}

/**
 * Singularize a verb to 3rd-person singular present tense.
 * E.g. "produce" → "produces", "absorb" → "absorbs", "generate" → "generates".
 */
function singularize(verb) {
  const v = verb.toLowerCase()
  if (v === 'are' || v === 'were') return 'is'
  if (v === 'have' || v === 'has') return 'has'
  if (v === 'do' || v === 'does') return 'does'
  if (v === 'can' || v === 'will' || v === 'shall' || v === 'may' || v === 'must' ||
      v === 'should' || v === 'could' || v === 'would') return v
  if (/(?:s|es|ies)$/.test(v) && !/(?:ss|us|is)$/.test(v)) return v // already 3sg
  if (/(?:x|s|z|ch|sh|o)$/.test(v)) return v + 'es'
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies'
  return v + 's'
}

/* ── Teacher-style stem builders ── */

/**
 * Base (dictionary) form of a 3rd-person / past verb for "What does X …?"
 * stems ("absorbs" → "absorb", "carries" → "carry", "has" → "have").
 */
function baseForm(verb) {
  const v = String(verb || '').toLowerCase()
  if (!v) return v
  if (v === 'has') return 'have'
  if (v === 'does') return 'do'
  if (v === 'goes') return 'go'
  if (/[^aeiou]ies$/.test(v)) return v.slice(0, -3) + 'y'
  if (/(?:ches|shes|sses|xes|zes|oes)$/.test(v)) return v.slice(0, -2)
  if (/[^s]s$/.test(v) && !/(?:ss|us|is)$/.test(v)) return v.slice(0, -1)
  return v
}

function subjectDisplay(s) {
  // Sentence-case common nouns read better lowercased mid-stem
  // ("What does chlorophyll absorb …?"), but proper-noun phrases and
  // acronyms keep their source form ("Calvin cycle", "CICC").
  const t = String(s || '').trim()
  if (!t || /\s/.test(t)) return t
  if (/^[A-Z][a-z'’-]*$/.test(t)) return t.charAt(0).toLowerCase() + t.slice(1)
  return t
}

const VERBAL_RE = /^(is|are|was|were|be|been|being|has|have|had|does|do|will|would|can|could|may|might|must|shall|should)$/i

function looksVerbal(w) {
  const t = String(w || '').replace(/[^A-Za-z]$/g, '')
  if (t.length < 3) return false
  if (VERBAL_RE.test(t)) return true
  return /(s|es|ies|ed|ing)$/.test(t.toLowerCase())
}

// Leading "subject + verb" of a sentence for object-questions. Handles
// two-word proper-noun subjects ("The Calvin cycle produces …" →
// subject "Calvin cycle", verb "produces").
function headSubjectVerb(sentence) {
  const words = String(sentence || '').split(/\s+/).filter(Boolean)
  if (words.length < 3) return null
  let si = 0
  if (/^(the|a|an)$/i.test(words[0])) si = 1
  const clean = w => String(w || '').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
  let subject = clean(words[si])
  let vi = si + 1
  const w2 = clean(words[vi])
  if (subject && /^[A-Z]/.test(subject) && w2 && /^[a-z]/.test(w2) && !looksVerbal(w2)) {
    const w3 = clean(words[vi + 1])
    if (w3 && looksVerbal(w3)) {
      subject += ' ' + w2
      vi += 1
    }
  }
  const verb = clean(words[vi])
  if (!subject || !verb || !looksVerbal(verb)) return null
  return { subject, verb }
}

/**
 * Build a teacher-style MCQ stem from a candidate sentence+term.
 * Returns { stem, style } where style is 'subject-question', 'definition',
 * 'object-question', 'concept' or 'acronym'.
 *
 * Subject-question: "Which of the following converts light energy into chemical energy?"
 * Definition: "Which term is described as: 'the process by which...'"?
 * Object-question: "What does chlorophyll absorb most strongly ...?"
 * Concept: "Which concept is described here: '... this concept ...'"?
 *
 * Fill-in-the-blank stems are never produced: every stem is a direct
 * question ending in "?" that never names the answer.
 */
export function buildMcqStem(sentence, term, opts = {}) {
  const split = splitSubject(sentence, term)

  if (split && split.predicate) {
    // Strategy 1 — Subject-question: replace subject with "Which of the following"
    const verb = split.style === 'copula' ? singularize(split.verb) : split.verb
    const predicate = split.predicate.trim()

    if (predicate.split(/\s+/).length >= 3) {
      const stem = `Which of the following ${verb} ${predicate}?`
      // Verify the answer term is NOT in the stem
      const termRe = new RegExp('\\b' + escapeRe(term) + '\\b', 'i')
      if (!termRe.test(stem)) {
        return { stem, style: 'subject-question' }
      }
    }

    // Strategy 2 — Definition: "Which term is described as: 'predicate'?"
    if (split.style === 'copula' && predicate.split(/\s+/).length >= 4) {
      const capPred = predicate.charAt(0).toLowerCase() + predicate.slice(1)
      const stem = `Which term is described as: "${capPred}"?`
      const termRe = new RegExp('\\b' + escapeRe(term) + '\\b', 'i')
      if (!termRe.test(stem)) {
        return { stem, style: 'definition' }
      }
    }
  }

  // Fallback — object-question: the term is the OBJECT ("Chlorophyll absorbs
  // sunlight …" → "What does chlorophyll absorb …?"). Direct exam style,
  // never a blank.
  {
    let idx = -1
    try {
      idx = sentence.search(new RegExp('\\b' + escapeRe(term) + '\\b', 'i'))
    } catch { idx = -1 }
    if (idx > 8) {
      const head = headSubjectVerb(sentence)
      if (head) {
        const { subject, verb } = head
        if (!/^(is|are|was|were|be|been|being|has|have|had)$/i.test(verb)) {
          const termEnd = idx + term.length
          const suffix = sentence.slice(termEnd).replace(/\s+/g, ' ').trim().replace(/^[,\s:;-]+/, '').replace(/[.!?…]+$/, '').trim()
          // A suffix opening a new clause ("a ViewModel exposes …") would
          // read broken as a "What does X …?" stem — those sentences fall
          // through to the concept style instead.
          if (suffix.split(/\s+/).filter(Boolean).length >= 2 && !/^(a|an|the)\s+[A-Z]/.test(suffix)) {
            const stem = `What does ${subjectDisplay(subject)} ${baseForm(verb)} ${suffix}?`.replace(/\s+/g, ' ')
            const termRe = new RegExp('\\b' + escapeRe(term) + '\\b', 'i')
            if (!termRe.test(stem) && stem.length <= 300) {
              return { stem, style: 'object-question' }
            }
          }
        }
      }
    }
  }

  // Copula anywhere in the sentence ("… term is …"), not just at the start.
  {
    let m = null
    try {
      m = sentence.match(new RegExp('\\b' + escapeRe(term) + '\\b\\s+(is|are|was|were)\\s+(.+?)[.!?…]?$', 'i'))
    } catch { m = null }
    if (m && m[2]) {
      const predicate = m[2].replace(/\s+/g, ' ').trim()
      if (predicate.split(/\s+/).length >= 4) {
        const capPred = predicate.charAt(0).toLowerCase() + predicate.slice(1)
        const stem = `Which term is described as: "${capPred}"?`
        const termRe = new RegExp('\\b' + escapeRe(term) + '\\b', 'i')
        if (!termRe.test(stem) && stem.length <= 300) {
          return { stem, style: 'definition' }
        }
      }
    }
  }

  // Last resort — concept description: quote the sentence with the answer
  // named as "this concept". Still a direct question, never a blank.
  {
    let describe = sentence
    try {
      describe = sentence.replace(new RegExp('\\b' + escapeRe(term) + '\\b', 'i'), 'this concept')
    } catch { /* keep original */ }
    if (describe.length > 240) describe = describe.slice(0, 220).trim() + '…'
    const stem = `Which concept is described here: "${describe}"?`
    const termRe = (() => { try { return new RegExp('\\b' + escapeRe(term) + '\\b', 'i') } catch { return null } })()
    if ((!termRe || !termRe.test(stem)) && stem.length <= 300) {
      return { stem, style: 'concept' }
    }
    return { stem: `Which of the following is a key concept in this material?`, style: 'concept' }
  }
}

/**
 * Build a short-answer prompt from a candidate sentence+term.
 * Teacher style: show the definition, ask for the term.
 */
export function buildShortPrompt(sentence, term) {
  const split = splitSubject(sentence, term)

  if (split && split.predicate) {
    // Definition → ask for the term
    const pred = split.predicate.trim()
    if (pred.split(/\s+/).length >= 3) {
      return `Which term is described as: "${pred.charAt(0).toLowerCase() + pred.slice(1)}"?`
    }
  }

  // Fallback: show the sentence with a blank, ask for the term
  const blanked = sentence.replace(
    new RegExp(escapeRe(term), 'i'),
    '________'
  )
  return blanked
}
