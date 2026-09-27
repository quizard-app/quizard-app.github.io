import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { listMistakes, getDoc, listDueCards, getWeakTerms } from '../engine/storage.js';
import { keyTerms, sentences } from '../engine/textproc.js';
import { buildMistakeQuestions } from '../engine/quizgen.js';
import { ToastService } from './toast.service';
import { QuizStateService } from './quiz-state.service';

@Injectable({ providedIn: 'root' })
export class MistakesService {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toast = inject(ToastService);
  private qs = inject(QuizStateService);

  private go() {
    // /quiz is often already in the page stack (results -> review): without a
    // root direction Ionic restores the frozen old quiz page instead of
    // starting the new session.
    this.navCtrl.setDirection('root', false);
    this.router.navigateByUrl('/quiz-review');
  }

  async startMistakeReview(docId?: string) {
    const mistakes = await listMistakes(docId);
    console.log('[QZ] startMistakeReview: found', mistakes.length, 'mistakes for doc', docId);
    if (!mistakes.length) { this.toast.toast('No mistakes to review — great job! 🎉'); return; }
    const docIds = [...new Set(mistakes.map(m => m.docId))];
    const docTerms = new Map();
    const docSentences = new Map();
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
      docSentences.set(id, doc ? sentences(doc.text) : []);
    }
    const questions = buildMistakeQuestions(mistakes, docTerms, docSentences);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: docId ? null : `All documents (${docIds.length})` });
    this.go();
  }

  async startDueReview() {
    const due = await listDueCards(30);
    if (!due.length) { this.toast.toast('Nothing due — come back later!'); return; }
    const docIds = [...new Set(due.map(m => m.docId))];
    const docTerms = new Map();
    const docSentences = new Map();
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
      docSentences.set(id, doc ? sentences(doc.text) : []);
    }
    const questions = buildMistakeQuestions(due, docTerms, docSentences);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: `Spaced review (${due.length} due)` });
    this.go();
  }

  async startWeakReview() {
    const weak = await getWeakTerms(null);
    if (!weak.length) { this.toast.toast('No weak spots yet — take a few quizzes first'); return; }
    const rank = new Map(weak.map((w: any) => [String(w.term).toLowerCase(), w.weight || 1]));
    const [mistakes, due] = await Promise.all([listMistakes(null), listDueCards(60)]);
    // Only true weak terms (2+ misses) belong in this drill; single misses
    // stay with due cards and Review answers.
    const items = [...mistakes, ...due].filter((it: any) => rank.has(String(it.term).toLowerCase()));
    if (!items.length) { this.toast.toast('No weak-spot questions to review yet'); return; }
    items.sort((a: any, b: any) => (rank.get(String(b.term).toLowerCase()) || 0) - (rank.get(String(a.term).toLowerCase()) || 0));
    const seen = new Set();
    const chosen: any[] = [];
    for (const it of items) {
      const k = String(it.term).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      chosen.push(it);
      if (chosen.length >= 30) break;
    }
    const docIds = [...new Set(chosen.map(m => m.docId))];
    const docTerms = new Map();
    const docSentences = new Map();
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
      docSentences.set(id, doc ? sentences(doc.text) : []);
    }
    const questions = buildMistakeQuestions(chosen, docTerms, docSentences);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: `Weak spots (${chosen.length} terms)` });
    this.go();
  }
}
