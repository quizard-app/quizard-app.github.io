# Quizard — Final Test Pass (Live Site)

- Site: https://quizard-app.github.io/
- Date: 12 September 2026
- Build: Ionic 8 + Angular (v2.0)
- Method: Automated browser test (Chrome, 390×844 viewport) walking every screen
- Result: **25 / 25 checks passed**, zero JavaScript errors

## Checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Welcome splash renders | PASS |
| 2 | Onboarding slides render | PASS |
| 3 | Account created with PIN | PASS |
| 4 | Tutorial renders with slides | PASS |
| 5 | Tutorial skip lands on Library | PASS |
| 6 | Paste import saves a document | PASS |
| 7 | PDF import extracts text | PASS |
| 8 | Library shows 2 documents | PASS |
| 9 | Library stats banner shows totals | PASS |
| 10 | Document rename works | PASS |
| 11 | Quiz setup renders with type tiles | PASS |
| 12 | Quiz setup stepper works | PASS |
| 13 | Quiz starts and shows questions | PASS |
| 14 | Quiz questions answerable | PASS |
| 15 | Results screen reached with score ring | PASS |
| 16 | Reviewer renders with tabs | PASS |
| 17 | Reviewer text-to-speech bar present | PASS |
| 18 | Flashcards open | PASS |
| 19 | Progress screen shows attempt stats | PASS |
| 20 | Exam wizard chat replies | PASS |
| 21 | Theme toggles dark to light | PASS |
| 22 | Backup export button present | PASS |
| 23 | Library lists documents again | PASS |
| 24 | PIN lock screen appears | PASS |
| 25 | PIN unlock returns to Library | PASS |

## Also verified separately

- AI screenshot questions: a PDF with a chart was imported; Gemini read the
  rendered page and produced a multiple-choice question displayed with the
  page screenshot above it.
- AI exam-wizard conversation: the wizard replies through the key-rotating relay.
- PDF export, markdown export, and the floating tab bar on desktop were
  verified in earlier passes of the same build.

## Known behavior (by design)

- Image-based questions appear when the document is visual-heavy (slides,
  diagrams): they are added after the text questions and the quiz never
  exceeds the requested question count.
- Deep links (e.g. /tabs/history opened directly) boot through the 404
  fallback page; the first load of a deep link takes a few extra seconds.
