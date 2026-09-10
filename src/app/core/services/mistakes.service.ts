import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { listMistakes, getDoc, listDueCards, getWeakTerms, listDocs } from '../engine/storage.js';
import { keyTerms } from '../engine/textproc.js';
import { buildMistakeQuestions, generateQuiz } from '../engine/quizgen.js';
import { ToastService } from './toast.service';
import { QuizStateService } from './quiz-state.service';

@Injectable({ providedIn: 'root' })
export class MistakesService {
  private router = inject(Router);
  private toast = inject(ToastService);
  private qs = inject(QuizStateService);

  private go() { this.router.navigateByUrl('/quiz'); }

  async startMistakeReview(docId?: string) {
    const mistakes = await listMistakes(docId);
    if (!mistakes.length) { this.toast.toast('No mistakes to review — great job! 🎉'); return; }
    const docIds = [...new Set(mistakes.map(m => m.docId))];
    const docTerms = new Map();
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
    }
    const questions = buildMistakeQuestions(mistakes, docTerms);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: docId ? null : `All documents (${docIds.length})` });
    this.go();
  }

  async startDueReview() {
    const due = await listDueCards(30);
    if (!due.length) { this.toast.toast('Nothing due — come back later!'); return; }
    const docIds = [...new Set(due.map(m => m.docId))];
    const docTerms = new Map();
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
    }
    const questions = buildMistakeQuestions(due, docTerms);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: `Spaced review (${due.length} due)` });
    this.go();
  }

  async startWeakReview() {
    const weak = await getWeakTerms(null);
    if (!weak.length) { this.toast.toast('No weak spots yet — take a few quizzes first'); return; }
    const rank = new Map(weak.map((w: any) => [String(w.term).toLowerCase(), w.count || 1]));
    const [mistakes, due] = await Promise.all([listMistakes(null), listDueCards(60)]);
    const items = [...mistakes, ...due];
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
    for (const id of docIds) {
      const doc = await getDoc(id);
      docTerms.set(id, doc ? keyTerms(doc.text) : []);
    }
    const questions = buildMistakeQuestions(chosen, docTerms);
    if (!questions.length) { this.toast.toast('Could not build review questions'); return; }
    this.qs.mistakeReview.set({ questions, docName: `Weak spots (${chosen.length} terms)` });
    this.go();
  }

  async startMasterReview() {
    const metas = await listDocs();
    if (!metas.length) { this.toast.toast('Add a document first — nothing to master yet'); return; }
    const docs: any[] = [];
    for (const m of metas.slice(0, 6)) {
      const d = await getDoc(m.id);
      if (d && d.text) docs.push(d);
    }
    const [mistakes, due] = await Promise.all([listMistakes(null), listDueCards(60)]);
    const docTerms = new Map();
    for (const d of docs) docTerms.set(d.id, keyTerms(d.text));

    const questions: any[] = [];
    if (due.length) questions.push(...buildMistakeQuestions(due.slice(0, 8), docTerms));
    const perDoc = 3;
    const pools = docs.map(d => {
      const r = generateQuiz(d, { count: perDoc, mix: { mcq: true, tf: true, fib: true, id: true }, difficulty: 'medium', shuffle: true });
      return (r.questions || []).map((q: any) => ({ ...q, meta: { ...(q.meta || {}), docId: d.id } }));
    });
    for (let i = 0; i < perDoc; i++) {
      for (const pool of pools) { if (pool[i]) questions.push(pool[i]); }
    }
    const seenSentences = new Set(questions.map(q => q.meta?.sentence));
    const banked = mistakes.filter(m => !seenSentences.has(m.sentence));
    if (banked.length) questions.push(...buildMistakeQuestions(banked.slice(0, 8), docTerms));
    const final = questions.slice(0, 25);
    if (!final.length) { this.toast.toast('Nothing to review yet — take a quiz first'); return; }
    this.qs.mistakeReview.set({ questions: final, docName: `Master review (${docs.length} document${docs.length === 1 ? '' : 's'})` });
    this.go();
  }
}
