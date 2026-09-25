import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { KeyValuePipe } from '@angular/common';
import { TYPE_META } from '../../core/engine/quizgen.js';
import { buildExamQuiz } from '../../core/engine/exam.js';
import { authorExamQuiz } from '../../core/engine/quiz-ai.js';
import { loadSettings, getWeakTerms, listDueCards, listDocs, getDoc, getExam } from '../../core/engine/storage.js';
import { keyTerms } from '../../core/engine/textproc.js';
import { exportQuiz } from '../../core/engine/export.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { NavController } from '@ionic/angular';
import { MistakesService } from '../../core/services/mistakes.service';
import { ByokService } from '../../core/services/byok.service';

@Component({
  selector: 'app-results',
  imports: [IonContent, IcoPipe, KeyValuePipe],
  templateUrl: './results.html',
})
export class ResultsPage implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private qs = inject(QuizStateService);
  private navCtrl = inject(NavController);
  private mistakes = inject(MistakesService);
  readonly byok = inject(ByokService);
  readonly Math = Math;
  readonly objectKeys = Object.keys;

  @ViewChild('confetti') confetti?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ringWrap') ringWrap?: ElementRef<HTMLDivElement>;
  @ViewChild('reviewPanel') reviewPanel?: ElementRef<HTMLDivElement>;

  r = signal<any>(null);
  verdict = signal<{ h: string; s: string }>({ h: '', s: '' });
  weakCount = signal(0);
  dueCount = signal(0);
  suggestion = signal<any>(null);
  showReview = signal(false);
  reviewing: any[] = [];
  questions: any[] = [];
  metaName = (t: string | number | symbol) => (TYPE_META as Record<string, any>)[String(t)]?.name || t;
  pctDisplay = signal('0%');
  readonly ringC = (2 * Math.PI * 76).toFixed(1);
  ringOffset = signal(2 * Math.PI * 76);

  async ngOnInit() {
    const r = this.qs.lastAttempt();
    if (!r) { this.router.navigateByUrl('/tabs/library'); return; }
    this.r.set(r);
    this.reviewing = r.review || [];
    this.questions = r.questions || [];
    const verdict = r.percent >= 90 ? ['Outstanding!', 'You have mastered this material.']
      : r.percent >= 75 ? ['Great job!', 'Solid understanding — review the misses to perfect it.']
      : r.percent >= 50 ? ['Good effort', 'A quick review will push you higher.']
      : ['Keep practicing', 'Revisit the document and try again.'];
    this.verdict.set({ h: verdict[0], s: verdict[1] });

    try {
      const [weak, due] = await Promise.all([getWeakTerms(null), listDueCards(60)]);
      this.weakCount.set(weak.length);
      this.dueCount.set(due.length);
    } catch { /* optional */ }

    try {
      const meta = (await listDocs()).filter((d: any) => d.id !== r.docId);
      const mine = new Set(keyTerms((r.review || []).map((x: any) => x.correct).join('. ') || '').map((t: any) => t.term.toLowerCase()).slice(0, 12));
      if (mine.size) {
        let best: any = null;
        for (const m of meta.slice(0, 12)) {
          const full = await getDoc(m.id).catch(() => null);
          if (!full?.text) continue;
          const theirs = new Set(keyTerms(full.text).map((t: any) => t.term.toLowerCase()).slice(0, 16));
          let overlap = 0;
          for (const t of mine) if (theirs.has(t)) overlap++;
          if (!best || overlap > best.overlap) best = { doc: { ...m }, overlap };
        }
        if (best && best.overlap >= 2) this.suggestion.set(best);
      }
    } catch { /* suggestion optional */ }

    // ring + number animation, confetti, sparkle trail
    setTimeout(() => {
      const C = 2 * Math.PI * 76;
      this.ringOffset.set(C * (1 - r.percent / 100));
      this.animateNumber(r.percent);
      this.sparkleTrail(r.percent);
      if (r.percent >= 70 && this.confetti) this.fireConfetti(this.confetti.nativeElement);
    }, 150);
  }

  private animateNumber(target: number) {
    const dur = 900;
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      this.pctDisplay.set(Math.round(eased * target) + '%');
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private sparkleTrail(percent: number) {
    const ring = this.ringWrap?.nativeElement.querySelector('.result-ring') as HTMLElement | null;
    if (!ring || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const N = 14;
    const sparks: HTMLElement[] = [];
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      s.className = 'ring-spark';
      ring.appendChild(s);
      sparks.push(s);
    }
    const duration = 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const head = t * (percent / 100);
      sparks.forEach((s, i) => {
        const trailPos = Math.max(0, head - i * 0.035);
        const angle = trailPos * 2 * Math.PI - Math.PI / 2;
        const R = 76;
        s.style.left = (86 + R * Math.cos(angle)) + 'px';
        s.style.top = (86 + R * Math.sin(angle)) + 'px';
        const fade = 1 - i / N;
        s.style.opacity = String(fade * (trailPos > 0 ? 1 : 0));
        s.style.transform = `translate(-50%, -50%) scale(${0.55 + fade * 0.45})`;
      });
      if (t < 1) requestAnimationFrame(tick);
      else sparks.forEach(s => s.remove());
    };
    requestAnimationFrame(tick);
  }

  private fireConfetti(canvas: HTMLCanvasElement) {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const ctx2d = canvas.getContext('2d')!;
    const colors = ['#6366f1', '#a855f7', '#34d399', '#fbbf24', '#fb7185', '#60a5fa'];
    const pieces = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      w: 7 + Math.random() * 7,
      h: 9 + Math.random() * 9,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2.4 + Math.random() * 3.4,
      vx: -1.6 + Math.random() * 3.2,
      rot: Math.random() * Math.PI,
      vr: -0.14 + Math.random() * 0.28
    }));
    let frames = 0;
    const tick = () => {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx2d.save();
        ctx2d.translate(p.x, p.y);
        ctx2d.rotate(p.rot);
        ctx2d.fillStyle = p.c;
        ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx2d.restore();
      }
      frames++;
      if (frames < 260) requestAnimationFrame(tick);
      else canvas.remove();
    };
    requestAnimationFrame(tick);
  }

  toggleReview() { this.showReview.set(!this.showReview()); }

  doExport() {
    const r = this.r();
    const ok = exportQuiz(r.docName || 'Quiz', r);
    if (!ok) this.toast.toast('Nothing to export');
  }

  retake() {
    const r = this.r();
    // Root direction everywhere: Ionic must rebuild the target page, never
    // re-show a frozen quiz/results instance left in the stack.
    this.navCtrl.setDirection('root', false);
    if (r.mistakeMode) {
      // "Review Again" on a review round restarts the same question set —
      // dumping the learner back in the library just loses the round.
      if (r.questions?.length) {
        this.qs.mistakeReview.set({ questions: r.questions.map((q: any) => ({ ...q })), docName: r.docName || 'Mistake Review' });
        this.router.navigateByUrl('/quiz-review');
      } else {
        this.router.navigateByUrl('/tabs/library');
      }
    } else {
      if (r.docId) this.qs.currentDocId.set(r.docId);
      this.router.navigateByUrl('/quiz-review');
    }
  }

  // ── Follow-up rounds: "Generate 20 more" (weighted to misses) + "Make it harder" ──
  crafting = signal('');
  private readonly ladder = ['easy', 'medium', 'hard'];

  private bumpDifficulty(d?: string) {
    // unknown levels (e.g. 'adaptive') bump up from medium, not easy
    const cur = d != null && this.ladder.includes(d) ? d : 'medium';
    return this.ladder[Math.min(this.ladder.length - 1, this.ladder.indexOf(cur) + 1)];
  }

  moreQuestions() { void this.followUp({ count: 20, bump: false }); }
  makeHarder() { void this.followUp({ count: 0, bump: true }); }

  private async followUp({ count, bump }: { count: number; bump: boolean }) {
    const r = this.r();
    if (!r || this.crafting()) return;
    const want = count || (r.questions?.length || 20);
    const difficulty = bump ? this.bumpDifficulty(r.cfg?.difficulty) : undefined;
    const weak = await getWeakTerms(r.docId ?? null).catch(() => []);

    // Exam practice rounds: craft here, then hand the questions to the quiz screen
    if (r.examMode && r.examId) {
      this.crafting.set(bump ? 'Crafting a harder set…' : `Crafting ${want} new questions…`);
      try {
        const exam = await getExam(r.examId);
        if (!exam) throw new Error('exam gone');
        const docs = (await Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null)))).filter(Boolean);
        const diff = difficulty || r.cfg?.difficulty || 'medium';
        let questions: any[] = [];
        try {
          const gen = await authorExamQuiz(exam, docs, { count: want, weakTerms: weak, difficulty: diff });
          questions = gen.questions || [];
        } catch { this.byok.notifyAiFailure('quota'); /* AI unavailable — offline set below */ }
        // AI batches under-deliver on big requests (per-topic quotas, validation
        // rejects, timeouts) — "20 more" used to come back as 4-7 questions.
        // Top up with the built-in generator so the requested size is met.
        if (questions.length < want) {
          const seen = new Set(questions.map((q: any) => String(q.meta?.sentence || q.stem || '').toLowerCase()).filter(Boolean));
          // buildExamQuiz is seeded from the exam id — without this it would
          // re-serve the sentences of the round the user just finished
          for (const q of (r.questions || [])) {
            const k = String((q as any).meta?.sentence || (q as any).stem || '').toLowerCase();
            if (k) seen.add(k);
          }
          const offline = buildExamQuiz(exam, docs, weak, { count: want, difficulty: diff }).questions || [];
          for (const q of offline) {
            if (questions.length >= want) break;
            const key = String((q as any).meta?.sentence || (q as any).stem || '').toLowerCase();
            if (key && seen.has(key)) continue;
            if (key) seen.add(key);
            questions.push(q);
          }
          questions = questions.slice(0, want);
        }
        if (!questions.length) { this.toast.toast('Not enough material in these files for another set', true); this.crafting.set(''); return; }
        this.qs.examSession.set({ examId: exam.id, questions, docName: exam.title });
        this.qs.mistakeReview.set(null);
        this.qs.currentDocId.set(null);
        this.crafting.set('');
        this.navCtrl.setDirection('root', false);
        this.router.navigateByUrl('/quiz-review');
      } catch {
        this.crafting.set('');
        this.toast.toast('Could not build a new set — try again', true);
      }
      return;
    }

    // Document rounds: retarget the stored config and let the quiz screen run
    // its normal pipeline (AI authoring + progress UI included).
    if (!r.docId) { this.toast.toast('This quiz has no source document', true); return; }
    let configs: Record<string, any> = {};
    try { configs = JSON.parse(localStorage.getItem('quizard-quiz-configs') || '{}'); } catch { /* fresh */ }
    const prev = configs[r.docId] || {};
    configs[r.docId] = {
      ...prev,
      count: want,
      fresh: true,
      shuffle: false,
      timerSec: prev.timerSec || 0,
      topics: [],
      difficulty: difficulty || prev.difficulty || 'medium',
      ai: true,
      aiAuthor: true,
      weakTerms: weak
    };
    localStorage.setItem('quizard-quiz-configs', JSON.stringify(configs));
    this.qs.currentDocId.set(r.docId);
    this.qs.examSession.set(null);
    this.qs.mistakeReview.set(null);
    this.navCtrl.setDirection('root', false);
    this.router.navigateByUrl('/quiz-review');
  }

  reviewMistakes() { this.mistakes.startMistakeReview(this.r().docId ?? undefined); }
  weakReview() { this.mistakes.startWeakReview(); }
  dueReview() { this.mistakes.startDueReview(); }
  alsoLike() { this.router.navigate(['/reviewer', this.suggestion().doc.id]); }
  goLibrary() {
    // root direction drops lingering quiz/results pages from the Ionic stack
    this.navCtrl.setDirection('root', false);
    this.router.navigateByUrl('/tabs/library');
  }
}

// small helper to lazily reach the MistakesService (avoids circular template deps)

