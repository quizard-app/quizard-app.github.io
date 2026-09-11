import { Injectable, signal } from '@angular/core';

// Carries quiz-session payloads between screens (the vanilla app kept these
// on ctx.state): shared/deck quiz about to play, the active session, and the
// doc being configured.
@Injectable({ providedIn: 'root' })
export class QuizStateService {
  // set when playing a saved/shared deck
  readonly sharedQuiz = signal<{ title: string; questions: any[]; cfg: any } | null>(null);
  // the document the quiz was built from (null for shared decks)
  readonly currentDocId = signal<string | null>(null);
  // last attempt summary for the results screen
  readonly lastAttempt = signal<any>(null);
  // an exam-prep practice session launched from the exam detail screen
  readonly examSession = signal<{ examId: string; questions: any[]; docName: string } | null>(null);
  // an active mistake/weak/due/master review session
  readonly mistakeReview = signal<{ questions: any[]; docName: string | null } | null>(null);
}
