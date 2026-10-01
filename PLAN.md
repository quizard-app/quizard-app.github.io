# Quizard for Teachers — Build Plan

The app pivots to a **teacher-only, offline-first paper-quiz workstation**. Students never
touch the app. The teacher's loop: set up classes → provide keys / upload lessons →
generate a quiz (AI, online, once) → print quiz + bubble sheets → students take it on
paper → **scan the pile offline** → scores, item analysis, exports.

Everything decided in design discussions is locked below. Phases ship **one at a time**,
each through the standard flow: tests → build → browser verification → deploy.

## Locked decisions

| # | Decision |
|---|---|
| 1 | Teacher-only app. All student features retire (quiz-taking, reviewer, exams, streaks/progress, tutorial gamification). |
| 2 | Tabs: **Classes · Keys · Create · Check papers · Results** (+ Settings). |
| 3 | Roster upload: paste or .txt/.csv — name, grade, section. Stored on-device. |
| 4 | Answer keys accept three shapes: **answer only** (`1. Photosynthesis` — AI writes the question), **question + answer** (`What do plants use to make food? → Photosynthesis` — AI uses the teacher's question and only invents the 3 distractors), or **compact letter key** (`BCADB…` — scoring only, for an already-made quiz). Keys are per subject. |
| 5 | Create tab: upload file (PDF/PPTX/DOCX/TXT/MD — existing engine) + **three modes, teacher chooses**: *Full AI* (file only — AI writes questions, options, and key), *Anchor to my key* (key fixes correct answers, AI writes questions), or *Match my format* (teacher pastes their own MCQ examples — question, options A–D, correct answer marked — and AI generates new questions from the file mimicking that exact style; examples are in-context references each generation, not permanent training). |
| 6 | Teacher picks the number of questions (up to 50); the printed sheet adapts to the count. |
| 7 | Teacher reviews/edits every item before export. Generated quizzes + keys are saved on-device and re-printable offline. |
| 8 | AI generation is the **only online step**. Scanning, scoring, saving, results = zero internet. |
| 9 | Bubble sheet (see spec below) — generic sheets v1 (teacher confirms student from roster); personalized per-student QR sheets as a v2 upgrade. |
| 10 | Scanner reads bubbles + QR only — never handwritten fields. No AI in the scanner at all. |

## Bubble answer sheet spec (v1)

- Two-column grid, up to 50 items (25 rows × 2 cols), A–D outline circles, adapts to chosen count
- Four black corner markers + QR code (encodes quiz/key ID) inside the frame — alignment + auto-identification at scan time
- Pre-printed top: subject + quiz title. Write-ins below: **Student Name, Date, Grade & Section** (replaces Test ID)
- Photocopies of the template scan fine

## Architecture

**Kept (engine layer):** storage.js (IndexedDB + accounts + migrations), export.js (jsPDF),
import page's camera/image capture, AI plumbing (relay/BYOK) + quiz generation engine
(re-anchored to key/file modes), settings/theme/service worker, icons/helpers.

**Retired (student UI):** library, doc detail, reviewer, student quiz-taking, student
results/progress/history, exams + exam-chat, setup, welcome/tutorial gamification.
Routes are pruned as phases replace them; final code sweep in Phase 4.

**New storage (IDB v10):** `classes` (rosters), `keys` (answer keys), `quizzes`
(generated quizzes + derived keys), `sheets` (scan results). All account-scoped.

**New dependency:** a tiny offline QR encoder for the sheet (e.g. `qrcode-generator`,
~10 KB, no deps).

## Phases (one at a time)

### Phase 1 — Teacher shell + foundation
- New tab shell + navigation; simplified onboarding
- IDB v10 + storage CRUD for classes and keys
- **Classes page:** roster upload (paste / .txt / .csv; `Name` or `Name, Grade, Section` per line), list/edit/delete classes
- **Keys page:** create/edit keys with a forgiving paste parser
- Acceptance: teacher can set up classes and keys; ship flow green

### Phase 2 — Create: generate + export
- File upload → text extraction (reuse engine)
- Generation, three modes (Full AI / anchor to key / match-my-format with the teacher's MCQ examples as style references), teacher-set item count
- Key parser extended to recognize full MCQ examples (question + options A–D + marked correct answer) in the same paste box
- Review/edit screen (edit question text, options, correct answer)
- Save quiz (+ key) on-device
- Export: quiz PDF (no answers) + **teacher's answer-key copy** (questions with correct answers marked) + bubble sheet PDF (two-column, corner markers, QR)
- Acceptance: teacher can print a complete paper quiz offline thereafter

### Phase 3 — Check papers (offline scanner)
- `omr.js` engine: threshold → corner detection → perspective transform → bubble fill sampling → ambiguity flags (double-shaded / too light / blank)
- Camera capture with file-input fallback
- Scan session UI: pick class (key auto-resolves from QR) → per sheet: photo + detected answers (tap to correct) + student picker from roster → save
- Acceptance: checking a class pile works end to end with airplane mode on

### Phase 4 — Results + cleanup
- **Results page:** class score lists, item analysis (per-question miss rates), CSV + PDF export
- Delete retired student pages/routes; bundle-size sweep
- Acceptance: full loop demo-able to the teacher; student code gone

## Risks / notes
- iOS PWA camera quirks → file-input `capture` fallback from day one
- Pencil vs pen shading → adaptive threshold; sheet instructs "shade fully"
- Photocopier scaling → corner-marker homography absorbs it
- Existing installed PWAs auto-update into the teacher app; old student data stays dormant in IDB
- Branding rename (Quizard/wizard art) deferred — cosmetic

## Working agreement
One phase at a time; each ends committed to main + deployed to gh-pages + live-verified.
