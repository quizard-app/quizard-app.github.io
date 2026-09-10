import { Component, ElementRef, OnDestroy, OnInit, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import {
  getDoc, bankMistake, resolveMistake, srsIdFor, getSrsItem, upsertSrsFromMistake,
  gradeSrsItem, getImageById, loadSettings, saveAttempt
} from '../../core/engine/storage.js';
import { generateQuiz, TYPE_META } from '../../core/engine/quizgen.js';
import { generateQuizAI, gradeShortAnswer, explainQuestions, authorExamQuestions } from '../../core/engine/quiz-ai.js';
import { explainAnswer } from '../../core/engine/explain.js';
import { hasApiKey } from '../../core/engine/gemini.js';
import { checkTyped } from '../../core/engine/textproc.js';
import { blankHtml } from '../../shared/helpers.js';
import { assetUrl } from '../../shared/assets.js';
import { attachZoom } from '../../core/engine/imgZoom.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { QuizStateService } from '../../core/services/quiz-state.service';

interface QuizState {
  questions: any[]; index: number; correct: number; answers: any[]; startTime: number;
  resumed?: boolean; mistakeMode?: boolean; examMode?: boolean; examId?: string;
  shared?: boolean; docName?: string; adaptive?: boolean; challenge?: any;
}

function configKey(cfg: any) {
  return JSON.stringify([cfg.count, cfg.mix, cfg.difficulty, cfg.shuffle, cfg.timerSec, cfg.fresh, cfg.topics, !!cfg.ai, !!cfg.focusWeak, !!cfg.aiAuthor]);
}

@Component({
  selector: 'app-quiz',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './quiz.html',
  host: { '(window:keydown)': 'onKey($event)' }
})
export class QuizPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private qs = inject(QuizStateService);

  // boot phases
  phase = signal<'generating' | 'error' | 'active' | 'feedback'>('generating');
  genLabel = signal('Connecting to Gemini…');
  genPct = signal(0);
  errorMsg = signal('');

  // quiz state
  private doc: any = null;
  private cfg: any = null;
  private st!: QuizState;
  private session: any[] = [];
  private locked = false;
  private lastOk: boolean | null = null;
  private adaptiveOn = false;
  private timerInterval: any = null;
  imgUrlMap: Record<string, string> = {};
  private keyCleanup: (() => void) | null = null;
  private gradedThisCard = true;

  // template bindings
  q = signal<any>(null);
  progressPct = signal(0);
  counter = signal('');
  timerVal = signal<number | null>(null);
  timerDanger = signal(false);
  wizThinking = assetUrl('wizard/wizard-thinking.jpg');
  wizOk = assetUrl('wizard/wizard-celebrating.jpg');
  wizBad = assetUrl('wizard/wizard-encouraging.jpg');

  // per-question interaction state
  revealed = signal<Record<number, string>>({});
  picked = signal<Set<number>>(new Set());
  idAnswer = '';
  shortAnswer = '';
  matchLeft = signal<number | null>(null);
  matchLinks = signal<Record<number, number>>({});
  orderChosen = signal<number[]>([]);
  fbOk = signal(false);
  fbCorrectText = signal('');
  fbExplanation = signal('');
  fbExplainLoading = signal(false);
  srsId = signal<string | null | undefined>(undefined);
  showViewer = signal(false);
  viewerSrc = '';
  private zoom: any = null;
  @ViewChild('viewerImg') viewerImg?: ElementRef<HTMLImageElement>;

  get adaptiveTier(): string | null {
    const q = this.q();
    return this.adaptiveOn && q?.meta?.tier ? q.meta.tier : null;
  }
  tierLabel(tier: string) { return tier === 'easy' ? 'Easy' : tier === 'hard' ? 'Hard' : 'Med'; }
  get metaShort() { const q = this.q(); return q ? (TYPE_META as Record<string, any>)[q.type]?.short || q.type : ''; }
  get total() { return this.session.length; }
  get curIndex() { return this.st?.index ?? 0; }
  get matchedCount() { return Object.keys(this.matchLinks()).length; }
  letter(i: number) { return String.fromCharCode(65 + i); }
  get canExplain() { return hasApiKey() && loadSettings().aiExplain !== false; }

  private accountId() { return this.ui.account()?.id || 'default'; }
  private resumeKey() { return `quizard-active-quiz-${this.accountId()}`; }

  private configs(): Record<string, any> {
    try { return JSON.parse(localStorage.getItem('quizard-quiz-configs') || '{}'); } catch { return {}; }
  }
  private cachedQuiz: Record<string, any> = (() => { try { return (window as any).__qzCachedQuiz || ((window as any).__qzCachedQuiz = {}); } catch { return (window as any).__qzCachedQuiz = {}; } })();

  private saveResumeState() {
    if (this.st.mistakeMode || !this.doc) return;
    try {
      localStorage.setItem(this.resumeKey(), JSON.stringify({
        docId: this.doc.id, docName: this.doc.name, questions: this.session,
        index: this.st.index, correct: this.st.correct, answers: this.st.answers, savedAt: Date.now()
      }));
    } catch { /* storage full */ }
  }
  private clearResumeState() { localStorage.removeItem(this.resumeKey()); }

  async ngOnInit() { await this.boot(); }
  ngOnDestroy() { this.stopTimer(); this.revokeImages(); }

  private updateGen(done: number, total: number) {
    this.genPct.set(total ? Math.round((done / total) * 100) : 0);
    this.genLabel.set(total ? `Writing question ${Math.min(done + 1, total)} of ${total}…` : 'Connecting to Gemini…');
  }

  private async boot() {
    const qs = this.qs;
    let doc: any = null, cfg: any = null, st: QuizState | null = null, session: any[] | null = null;

    // mistake / weak / due / master review session
    if (qs.mistakeReview()) {
      const ms = qs.mistakeReview()!;
      qs.mistakeReview.set(null);
      const session = ms.questions;
      this.session = session;
      this.doc = null; this.cfg = { timerSec: 0, count: session.length };
      this.st = { questions: session, index: 0, correct: 0, answers: [], startTime: Date.now(), mistakeMode: true, docName: ms.docName || 'Mistake Review' };
      this.beginAttempt();
      return;
    }

    // shared deck (library "saved quizzes" / share links)
    if (qs.sharedQuiz()) {
      const shared = qs.sharedQuiz()!;
      qs.sharedQuiz.set(null);
      session = shared.questions;
      cfg = { timerSec: shared.cfg?.timerSec || 0, count: session.length };
      st = { questions: session, index: 0, correct: 0, answers: [], startTime: Date.now(), shared: true, docName: shared.title || 'Shared Quiz' };
      this.session = session; this.doc = null; this.cfg = cfg; this.st = st;
      this.beginAttempt();
      return;
    }

    doc = await getDoc(qs.currentDocId() || '');
    if (!doc) { this.router.navigateByUrl('/tabs/library'); return; }
    cfg = this.configs()[doc.id];
    if (!cfg) { this.router.navigate(['/doc', doc.id, 'setup']); return; }

    this.doc = doc; this.cfg = cfg;

    if (cfg.fresh || !this.cachedQuiz[doc.id]) {
      let gen: any = null;
      if (cfg.aiAuthor) {
        this.phase.set('generating');
        try { gen = await authorExamQuestions(doc, cfg, ((d: any, t: any) => this.updateGen(d, t)) as any); } catch { gen = null; }
        const enough = (gen?.questions?.length || 0) >= Math.ceil(cfg.count / 2);
        if (!enough) { this.toast.toast('AI authoring unavailable — using built-in questions', true); gen = null; }
      }
      if (!gen && cfg.ai) {
        this.phase.set('generating');
        try { gen = await generateQuizAI(doc, cfg, ((d: any, t: any) => this.updateGen(d, t)) as any); } catch { gen = null; }
        if (gen?.aiNote === 'no_key') this.toast.toast('Built-in questions ready — add a free Gemini key in Settings for AI-written ones');
        else if (gen?.aiNote) this.toast.toast(`Gemini unavailable (${gen.aiNote}) — used built-in questions`, true);
      }
      if (!gen || gen.error === 'not_enough_content' || !gen.questions.length) {
        gen = generateQuiz(doc, cfg);
        if (cfg.difficulty === 'adaptive' && !gen.error && gen.questions.length) {
          const per = Math.max(2, Math.ceil(cfg.count / 3));
          const poolMix: any = { mcq: true, tf: true, fib: true, id: true, except: !!cfg.mix.except, multi: !!cfg.mix.multi };
          const pools: Record<string, any[]> = {};
          for (const tier of ['easy', 'medium', 'hard'] as const) {
            const r = generateQuiz(doc, { ...cfg, count: per, difficulty: tier, mix: poolMix, fixedSeed: (gen.seed ^ (tier === 'easy' ? 0x51ab : tier === 'medium' ? 0x9e37 : 0x77aa)) >>> 0 });
            pools[tier] = (r.questions || []).map((q: any) => ({ ...q, meta: { ...(q.meta || {}), tier } }));
          }
          const merged = [...pools['medium'], ...pools['easy'], ...pools['hard']];
          if (merged.length >= 4) { gen = { questions: merged.slice(0, cfg.count), seed: gen.seed, error: null, adaptive: true }; }
        }
      }
      if (gen.error === 'not_enough_content' || !gen.questions.length) {
        this.errorMsg.set("This document doesn't have enough readable text to build a quiz. Try a text-rich file.");
        this.phase.set('error');
        return;
      }
      session = gen.questions;
      this.cachedQuiz[doc.id] = { questions: session, configKey: configKey(cfg), index: 0, correct: 0, answers: [], adaptive: !!gen.adaptive };
    } else {
      const cached = this.cachedQuiz[doc.id];
      if (cached.configKey !== configKey(cfg)) { this.router.navigateByUrl('/quiz'); return; }
      session = cached.questions;
    }
    this.st = this.cachedQuiz[doc.id];
    this.session = this.st.questions;
    this.beginAttempt();
  }

  private async beginAttempt() {
    const st = this.st;
    st.startTime = Date.now();
    this.adaptiveOn = this.cfg?.difficulty === 'adaptive' && !st.mistakeMode && !st.examMode && !st.shared;

    if (loadSettings().aiExplain !== false && hasApiKey()) {
      explainQuestions(this.session).catch(() => {});
    }
    const imgIds = [...new Set(this.session.filter((q: any) => q.imageId).map((q: any) => q.imageId))];
    for (const id of imgIds) {
      try { const rec = await getImageById(id); if (rec?.blob) this.imgUrlMap[id] = URL.createObjectURL(rec.blob); } catch { /* ignore */ }
    }
    this.draw();
  }

  private currentQ() { return this.session[this.st.index]; }

  private adaptivePick() {
    if (!this.adaptiveOn || this.st.index + 1 >= this.session.length) return;
    let streak = 0;
    const ans = this.st.answers;
    for (let i = ans.length - 1; i >= 0; i--) { if (ans[i].userOk) streak++; else break; }
    const lastWrong = ans.length > 0 && !ans[ans.length - 1].userOk;
    const want = lastWrong ? 'easy' : streak >= 2 ? 'hard' : 'medium';
    const fallbacks = want === 'easy' ? ['easy', 'medium', 'hard'] : want === 'hard' ? ['hard', 'medium', 'easy'] : ['medium', 'easy', 'hard'];
    for (const tier of fallbacks) {
      for (let j = this.st.index + 1; j < this.session.length; j++) {
        if ((this.session[j].meta?.tier || 'medium') === tier) {
          const tmp = this.session[this.st.index];
          this.session[this.st.index] = this.session[j];
          this.session[j] = tmp;
          return;
        }
      }
    }
  }

  private draw() {
    this.adaptivePick();
    const q = this.currentQ();
    this.locked = false;
    this.q.set(q);
    this.revealed.set({});
    this.picked.set(new Set());
    this.idAnswer = '';
    this.shortAnswer = '';
    this.matchLeft.set(null);
    this.matchLinks.set({});
    this.orderChosen.set([]);
    this.fbExplanation.set('');
    this.srsId.set(undefined);
    this.progressPct.set(((this.st.index + 1) / this.total) * 100);
    this.counter.set(`${this.st.index + 1}/${this.total}`);
    this.phase.set('active');
    if (this.cfg?.timerSec > 0) this.startTimer(this.cfg.timerSec);
  }

  blankStem(stem: string) { return blankHtml(stem); }

  // ── timer ──
  private startTimer(seconds: number) {
    let remaining = seconds;
    this.timerVal.set(remaining);
    this.timerDanger.set(false);
    this.timerInterval = setInterval(() => {
      remaining--;
      this.timerVal.set(Math.max(0, remaining));
      if (remaining <= 5) this.timerDanger.set(true);
      if (remaining <= 0) { this.stopTimer(); this.handleAnswer(null); }
    }, 1000);
  }
  private stopTimer() { if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; } }

  optionClass(i: number) { return this.revealed()[i] || ''; }
  tfClass(isTrue: boolean) { return this.revealed()[isTrue ? 1 : 0] || ''; }

  async answerChoice(i: number) {
    if (this.locked) return;
    const q = this.q();
    const ok = i === q.answerIndex;
    const reveal: Record<number, string> = {};
    (q.options || q.choices || []).forEach((_: any, k: number) => {
      reveal[k] = k === q.answerIndex ? 'correct' : (k === i && !ok ? 'wrong' : 'dimmed');
    });
    this.revealed.set(reveal);
    await this.finishAnswer(ok, (q.options ?? q.choices)?.[i] ?? null);
  }

  async answerTf(v: boolean) {
    if (this.locked) return;
    const q = this.q();
    const ok = v === q.answer;
    this.revealed.set({ [v ? 1 : 0]: ok ? 'correct' : 'wrong', [v ? 0 : 1]: !ok ? 'dimmed' : '' });
    await this.finishAnswer(ok, v === true ? 'True' : v === false ? 'False' : null);
  }

  async submitId() {
    if (this.locked) return;
    const q = this.q();
    const ok = checkTyped(this.idAnswer, q.answer);
    await this.finishAnswer(ok, this.idAnswer.trim() || null);
  }

  async submitShort() {
    if (this.locked) return;
    this.locked = true;
    this.stopTimer();
    const q = this.q();
    const text = (this.shortAnswer || '').trim();
    let ok = checkTyped(text, q.answer);
    const graded = await gradeShortAnswer(text, q).catch(() => null);
    if (graded != null) ok = graded;
    await this.finishAnswer(ok, text);
  }

  // ── multi ──
  toggleMulti(i: number) {
    if (this.locked) return;
    const picked = new Set(this.picked());
    if (picked.has(i)) picked.delete(i);
    else if (picked.size < 2) picked.add(i);
    else return;
    this.picked.set(picked);
  }

  submitMulti() {
    if (this.locked || this.picked().size !== 2) return;
    this.locked = true;
    this.stopTimer();
    const q = this.q();
    const sel = [...this.picked()].sort((a, b) => a - b);
    const ok = sel.length === q.answerIndices.length && sel.every((v, k) => v === q.answerIndices[k]);
    const reveal: Record<number, string> = {};
    (q.options || []).forEach((_: any, i: number) => {
      reveal[i] = q.answerIndices.includes(i) ? 'correct' : (this.picked().has(i) ? 'wrong' : 'dimmed');
    });
    this.revealed.set(reveal);
    const chosenText = sel.map(i => q.options[i]).join(' · ');
    this.finishAnswer(ok, chosenText);
  }

  // ── matching ──
  pickLeft(i: number) { if (!this.locked) this.matchLeft.set(i); }
  pickRight(j: number, pairIndex: number) {
    if (this.locked || this.matchLeft() == null) return;
    const left = this.matchLeft()!;
    const links = { ...this.matchLinks() };
    for (const k of Object.keys(links)) if (links[+k] === j) delete links[+k];
    links[left] = j;
    this.matchLinks.set(links);
    this.matchLeft.set(null);
  }
  rightLinked(j: number) { return Object.values(this.matchLinks()).includes(j); }
  leftLinked(i: number) { return this.matchLinks()[i] != null; }
  leftSelected(i: number) { return this.matchLeft() === i; }
  matchStateFor(left: number): string {
    if (!this.locked) return this.leftLinked(left) ? 'linked' : (this.leftSelected(left) ? 'sel' : '');
    return this.matchLinks()[left] === left ? 'correct' : 'wrong';
  }
  rightStateFor(j: number): string {
    if (!this.locked) return this.rightLinked(j) ? 'linked' : '';
    const left = Object.keys(this.matchLinks()).find(k => this.matchLinks()[+k] === j);
    return left != null && +left === j ? 'correct' : 'wrong';
  }
  submitMatching() {
    if (this.locked) return;
    const q = this.q();
    const links = this.matchLinks();
    this.locked = true;
    this.stopTimer();
    let ok = true;
    for (let i = 0; i < q.pairs.length; i++) if (links[i] !== i) ok = false;
    const matched = Object.keys(links).filter(k => links[+k] === +k).length;
    this.finishAnswer(ok, `Matched ${matched}/${q.pairs.length}`);
  }

  // ── ordering ──
  orderPick(step: number) {
    if (this.locked) return;
    this.orderChosen.set([...this.orderChosen(), step]);
  }
  orderRemove(k: number) {
    if (this.locked) return;
    this.orderChosen.set(this.orderChosen().filter((_, i) => i !== k));
  }
  submitOrder() {
    if (this.locked) return;
    const q = this.q();
    const chosen = this.orderChosen();
    this.locked = true;
    this.stopTimer();
    const ok = chosen.every((si, k) => si === k);
    this.finishAnswer(ok, `Order: ${chosen.map(si => q.steps[si]).join(' → ')}`);
  }

  async handleAnswer(choice: any) {
    if (this.locked) return;
    this.locked = true;
    this.stopTimer();
    const q = this.q();
    if (q.type === 'short' || q.type === 'multi' || q.type === 'matching' || q.type === 'ordering') {
      this.finishAnswer(false, null);
      return;
    }
    if (q.type === 'id') {
      const ok = checkTyped(this.idAnswer, q.answer);
      await this.finishAnswer(ok, this.idAnswer.trim() || null);
      return;
    }
    void choice;
  }

  private async finishAnswer(ok: boolean, chosenText: string | null) {
    const q = this.currentQ();
    this.lastOk = ok;
    const correctText = q.type === 'id' ? q.answer
      : q.type === 'tf' ? String(q.answer)
      : q.type === 'short' ? q.answer
      : q.type === 'ordering' ? q.steps.join(' → ')
      : q.type === 'matching' ? q.pairs.map((p: any) => p.left).join(', ')
      : q.type === 'multi' ? q.answerIndices.map((i: number) => q.options[i]).join(' · ')
      : q.options?.[q.answerIndex] ?? q.choices?.[q.answerIndex];

    this.st.answers.push({
      type: q.type,
      sentence: q.meta?.sentence || q.statement || q.prompt || '',
      term: q.meta?.term || q.answer,
      chosen: chosenText,
      correct: correctText,
      userOk: ok
    });
    if (ok) this.st.correct++;

    const mDocId = this.doc?.id || q.meta?.docId;
    const mSentence = q.meta?.sentence || q.statement || '';
    const mTerm = q.meta?.term || q.answer;
    let srsId: string | null = null;
    if (mDocId && mSentence && mTerm) {
      if (ok) resolveMistake(mDocId, mTerm, mSentence).catch(() => {});
      else bankMistake({ docId: mDocId, sentence: mSentence, term: mTerm, type: q.type }).catch(() => {});
      try {
        srsId = srsIdFor(mDocId, mTerm, mSentence);
        if (!(await getSrsItem(srsId))) await upsertSrsFromMistake({ docId: mDocId, sentence: mSentence, term: mTerm, type: q.type });
        if (!this.st.mistakeMode) await gradeSrsItem(srsId, ok ? 'good' : 'again');
      } catch { /* best-effort */ }
    }
    this.saveResumeState();
    this.fbOk.set(ok);
    this.fbCorrectText.set(correctText);
    this.fbExplanation.set(q.explanation || '');
    this.srsId.set(this.st.mistakeMode ? srsId : undefined);
    this.phase.set('feedback');
  }

  async grade(g: string) {
    const id = this.srsId();
    if (id) { this.gradedThisCard = true; await gradeSrsItem(id, g as any).catch(() => {}); }
    this.advance();
  }

  async advance() {
    if (this.st.index < this.total - 1) {
      if (!this.gradedThisCard && this.srsId()) {
        this.gradedThisCard = true;
        await gradeSrsItem(this.srsId()!, this.fbOk() ? 'good' : 'again').catch(() => {});
      }
      this.st.index++;
      this.draw();
    } else {
      if (!this.gradedThisCard && this.srsId()) {
        this.gradedThisCard = true;
        await gradeSrsItem(this.srsId()!, this.fbOk() ? 'good' : 'again').catch(() => {});
      }
      await this.finish();
    }
  }

  async explain() {
    this.fbExplainLoading.set(true);
    try {
      const text = await explainAnswer(this.q(), this.st.answers[this.st.index]?.chosen ?? null);
      this.q().explanation = text;
      this.fbExplanation.set(text);
    } catch {
      this.fbExplanation.set("Couldn't load an explanation right now.");
    } finally {
      this.fbExplainLoading.set(false);
    }
  }

  private async finish() {
    this.stopTimer();
    const st = this.st;
    const durationSec = (Date.now() - st.startTime) / 1000;
    const percent = Math.round((st.correct / this.total) * 100);
    const wrongCount = st.answers.filter(a => !a.userOk).length;
    const byType: Record<string, { c: number; t: number }> = {};
    for (const a of st.answers) { byType[a.type] = byType[a.type] || { c: 0, t: 0 }; byType[a.type].t++; if (a.userOk) byType[a.type].c++; }

    if ((!st.mistakeMode && this.doc) || st.examMode) {
      await saveAttempt({
        docId: this.doc?.id || null,
        docName: st.docName || this.doc?.name || 'Exam Prep',
        examId: st.examId || undefined,
        correct: st.correct, total: this.total, percent, durationSec, byType
      });
    }
    const review = this.session.map((q: any, i: number) => {
      let prompt = q.statement || q.stem || q.clue || q.prompt || '';
      let answer = q.type === 'id' || q.type === 'short' ? q.answer
        : q.type === 'tf' ? String(q.answer)
        : q.type === 'multi' ? (q.answerIndices || []).map((k: number) => q.options?.[k]).filter(Boolean).join(' · ')
        : (q.options ?? q.choices)?.[q.answerIndex];
      if (q.type === 'matching') { prompt = `Match terms: ${(q.pairs || []).map((p: any) => p.left).join(' / ')}`; answer = (q.pairs || []).map((p: any) => `${p.left} → ${p.right}`).join('  |  '); }
      else if (q.type === 'ordering') { prompt = q.prompt || 'Put the steps in order'; answer = (q.steps || []).join(' → '); }
      return { prompt, answer, chosen: st.answers[i]?.chosen ?? null, ok: st.answers[i]?.userOk };
    });
    this.qs.lastAttempt.set({
      docId: this.doc?.id || null,
      docName: st.docName || this.doc?.name,
      correct: st.correct, total: this.total, percent, durationSec, wrongCount,
      mistakeMode: !!st.mistakeMode, shared: !!st.shared, examMode: !!st.examMode,
      challenge: st.challenge || null, cfg: { timerSec: this.cfg?.timerSec || 0 },
      byType, review,
      questions: this.session.map(q => ({ ...q }))
    });
    if (!st.mistakeMode && this.doc) delete this.cachedQuiz[this.doc.id];
    this.clearResumeState();
    this.router.navigateByUrl('/results');
  }

  async quit() {
    if (!await this.confirm.confirm('Quit this quiz?', "Your progress in this attempt won't be saved.", 'Yes, quit')) return;
    this.stopTimer();
    this.revokeImages();
    if (this.doc) delete this.cachedQuiz[this.doc.id];
    this.clearResumeState();
    this.router.navigateByUrl('/tabs/library');
  }

  openViewer(src: string) {
    this.viewerSrc = src;
    this.showViewer.set(true);
    setTimeout(() => {
      const img = this.viewerImg?.nativeElement;
      if (img && !this.zoom) this.zoom = attachZoom(img.closest('.img-viewer') as HTMLElement, img);
      this.zoom?.reset();
    });
  }
  closeViewer() { this.showViewer.set(false); }
  zoomIn() { this.zoom?.zoomIn(); }
  zoomOut() { this.zoom?.zoomOut(); }
  zoomReset() { this.zoom?.reset(); }

  private revokeImages() { for (const u of Object.values(this.imgUrlMap)) URL.revokeObjectURL(u); }

  onKey(e: KeyboardEvent) {
    if (this.phase() !== 'active' && this.phase() !== 'feedback') return;
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (this.phase() === 'feedback') {
      if (e.key === 'Enter') this.advance();
      return;
    }
    const q = this.q();
    if (!q) return;
    if (this.locked) return;
    if (q.type === 'mcq' || q.type === 'fib' || q.type === 'except') {
      const opts = q.options || q.choices;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= opts.length) { this.answerChoice(n - 1); return; }
      const li = ['A', 'B', 'C', 'D'].indexOf(e.key.toUpperCase());
      if (li >= 0 && li < opts.length) this.answerChoice(li);
    } else if (q.type === 'tf') {
      const k = e.key.toLowerCase();
      if (k === 't') this.answerTf(true);
      else if (k === 'f') this.answerTf(false);
    }
  }
}
