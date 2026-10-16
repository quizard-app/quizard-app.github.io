// Demo world for the built-in demo tools. ONE deterministic dataset: two
// classes, two answer keys, three quizzes and a pile of already-checked
// sheets — enough to make every screen (gradebook, reports, review PDF,
// scan simulator) feel like a teacher's real week, not an empty shell.
//
// Every record is tagged `demo: true` so "Remove demo data" can sweep them
// without touching anything the teacher made. Fixed `demo-` ids make
// re-loading idempotent: the storage layer upserts instead of duplicating.
import { saveClass, saveKey, saveQuiz, saveSheet } from './storage.js'
import { mulberry32 } from './textproc.js'

const SCI_CLASS = {
  id: 'demo-cls-sci', name: 'Science 7-A', subject: 'Science', grade: '7', section: 'Sampaguita',
  students: [
    { name: 'Ana Reyes', no: 1 }, { name: 'Ben Cruz', no: 2 },
    { name: 'Cara Diaz', no: 3 }, { name: 'Darna Villanueva', no: 4 },
    { name: 'Elias Cruz', no: 5 }, { name: 'Fina Mercado', no: 6 },
    { name: 'Gab Torres', no: 7 }, { name: 'Hana Lopez', no: 8 },
  ],
}

const ENG_CLASS = {
  id: 'demo-cls-eng', name: 'English 8-B', subject: 'English', grade: '8', section: 'Molave',
  students: [
    { name: 'Ivan Ramos', no: 1 }, { name: 'Joy Aquino', no: 2 },
    { name: 'Kat Bautista', no: 3 }, { name: 'Leo Mendoza', no: 4 },
    { name: 'Mike Garcia', no: 5 }, { name: 'Nina Flores', no: 6 },
    { name: 'Omar Reyes', no: 7 }, { name: 'Pia Navarro', no: 8 },
    { name: 'Ria Santos', no: 9 }, { name: 'Sam Ocampo', no: 10 },
    { name: 'Tina Delgado', no: 11 }, { name: 'Vina Castro', no: 12 },
  ],
}

// Quiz built from real lesson text (the 'ai' path): 10 questions with four
// options each, correct index spread around A–D so the paper looks natural.
const CELL_ITEMS = [
  { n: 1, question: 'Which organelle is the control center of the cell?', options: ['Mitochondrion', 'Nucleus', 'Vacuole', 'Cell wall'], answerIndex: 1 },
  { n: 2, question: 'What is known as the powerhouse of the cell?', options: ['Nucleus', 'Chloroplast', 'Mitochondrion', 'Ribosome'], answerIndex: 2 },
  { n: 3, question: 'Which structure is found only in plant cells?', options: ['Cell wall', 'Cell membrane', 'Nucleus', 'Cytoplasm'], answerIndex: 0 },
  { n: 4, question: 'Where are proteins made?', options: ['Vacuole', 'Lysosome', 'Nucleus', 'Ribosome'], answerIndex: 3 },
  { n: 5, question: 'Which organelle stores water and waste?', options: ['Vacuole', 'Ribosome', 'Cell wall', 'Golgi body'], answerIndex: 0 },
  { n: 6, question: 'What controls what enters and leaves the cell?', options: ['Nucleus', 'Golgi body', 'Cell membrane', 'Lysosome'], answerIndex: 2 },
  { n: 7, question: 'Which organelle captures sunlight to make food?', options: ['Mitochondrion', 'Chloroplast', 'Ribosome', 'Vacuole'], answerIndex: 1 },
  { n: 8, question: 'What is the jelly-like substance that holds the organelles?', options: ['Nucleus', 'Cell wall', 'Chloroplast', 'Cytoplasm'], answerIndex: 3 },
  { n: 9, question: 'Which cell part recycles worn-out organelles?', options: ['Lysosome', 'Ribosome', 'Vacuole', 'Cell membrane'], answerIndex: 0 },
  { n: 10, question: 'Where does the cell keep its genetic instructions?', options: ['Cell membrane', 'Nucleus', 'Cytoplasm', 'Vacuole'], answerIndex: 1 },
]

// Quiz generated from a word answer key (the 'key' path): questions written
// against the key's answers.
const VERB_ITEMS = [
  { n: 1, question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answerIndex: 1 },
  { n: 2, question: 'Yesterday, they ___ a movie.', options: ['watch', 'watches', 'watched', 'watching'], answerIndex: 2 },
  { n: 3, question: 'We ___ our homework before dinner last night.', options: ['finish', 'finishes', 'finished', 'finishing'], answerIndex: 2 },
  { n: 4, question: 'The sun ___ in the east.', options: ['rise', 'rises', 'rose', 'rising'], answerIndex: 1 },
  { n: 5, question: 'I ___ for my keys right now.', options: ['look', 'am looking', 'looked', 'looks'], answerIndex: 1 },
  { n: 6, question: 'They ___ in Cebu since 2015.', options: ['live', 'lives', 'have lived', 'living'], answerIndex: 2 },
  { n: 7, question: 'He ___ his bike when it started to rain.', options: ['ride', 'rides', 'was riding', 'ridden'], answerIndex: 2 },
  { n: 8, question: 'By tomorrow, she ___ the book.', options: ['will finish', 'finishes', 'finished', 'finishing'], answerIndex: 0 },
]

// Letters-only key (the no-lesson path): the teacher's own paper carries the
// questions, so the app only holds the scoring grid.
const TECTONIC_LETTERS = 'BCADCABDBA'

export function buildDemoWorld() {
  const classes = [
    { ...SCI_CLASS, students: SCI_CLASS.students.map(s => ({ ...s })), demo: true },
    { ...ENG_CLASS, students: ENG_CLASS.students.map(s => ({ ...s })), demo: true },
  ]

  const keys = [
    {
      id: 'demo-key-1', subject: 'Science', title: 'Cell Basics', format: 'answers',
      items: CELL_ITEMS.map(it => ({ n: it.n, answer: it.options[it.answerIndex] })), demo: true,
    },
    {
      id: 'demo-key-2', subject: 'English', title: 'Verb Tenses', format: 'letters',
      items: VERB_ITEMS.map(it => ({ n: it.n, answerLetter: 'ABCD'[it.answerIndex] })), demo: true,
    },
  ]

  const quizzes = [
    {
      id: 'demo-quiz-1', subject: 'Science', title: 'Cell Basics', source: 'ai',
      items: CELL_ITEMS.map(it => ({ ...it })), demo: true,
    },
    {
      id: 'demo-quiz-2', subject: 'English', title: 'Verb Tenses', source: 'key',
      items: VERB_ITEMS.map(it => ({ ...it })), demo: true,
    },
    {
      id: 'demo-quiz-3', subject: 'Science', title: 'Plate Tectonics — quick check', source: 'key', keyOnly: true,
      items: TECTONIC_LETTERS.split('').map((ch, i) => ({ n: i + 1, question: '', options: ['', '', '', ''], answerIndex: 'ABCD'.indexOf(ch) })), demo: true,
    },
  ]

  // Already-checked results, filled by a seeded RNG so every run stores the
  // same scores: Science 7-A all took Cell Basics (and half took the letters
  // check), English 8-B's first six took Verb Tenses. Occasional blanks and
  // wrong picks come from the same seed.
  const rand = mulberry32(0x51abd2)
  const sheets = []
  const mkSheet = (n, cls, quiz, student, accuracy) => {
    const answers = quiz.items.map(it => {
      const r = rand()
      if (r < 0.06) return -1
      if (r < accuracy) return it.answerIndex
      return (it.answerIndex + 1 + Math.floor(rand() * 3)) % 4
    })
    const correct = answers.filter((a, i) => a === quiz.items[i].answerIndex).length
    return {
      id: `demo-sheet-${n}`, classId: cls.id, className: cls.name, quizId: quiz.id,
      studentNo: student.no, studentName: student.name, grade: cls.grade, section: cls.section,
      answers, flags: [], correct, total: quiz.items.length,
      percent: Math.round((correct / quiz.items.length) * 100), demo: true,
    }
  }
  const [sci, eng] = classes
  let n = 0
  const skill = [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]
  sci.students.forEach((st, i) => sheets.push(mkSheet(++n, sci, quizzes[0], st, skill[(i + 1) % skill.length] + (rand() - 0.5) * 0.1)))
  sci.students.slice(0, 5).forEach((st, i) => sheets.push(mkSheet(++n, sci, quizzes[2], st, 0.9 - i * 0.15 + (rand() - 0.5) * 0.1)))
  eng.students.slice(0, 6).forEach((st, i) => sheets.push(mkSheet(++n, eng, quizzes[1], st, skill[(i + 3) % skill.length] + (rand() - 0.5) * 0.1)))

  return { classes, keys, quizzes, sheets }
}

/** Pour the demo world through the real storage layer. Re-runs overwrite. */
export async function seedDemoData() {
  const world = buildDemoWorld()
  for (const k of world.keys) await saveKey(k)
  for (const q of world.quizzes) await saveQuiz(q)
  for (const c of world.classes) await saveClass(c)
  for (const s of world.sheets) await saveSheet({ ...s, createdAt: Date.now() - (world.sheets.length - world.sheets.indexOf(s)) * 3600_000 })
  return world
}
