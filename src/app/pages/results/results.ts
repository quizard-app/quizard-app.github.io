import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { KeyValuePipe } from '@angular/common';
import { TYPE_META } from '../../core/engine/quizgen.js';
import { explainAnswer } from '../../core/engine/explain.js';
import { hasApiKey } from '../../core/engine/gemini.js';
import { loadSettings, getWeakTerms, listDueCards, listDocs, getDoc } from '../../core/engine/storage.js';
import { keyTerms } from '../../core/engine/textproc.js';
import { exportQuiz } from '../../core/engine/export.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { ShareService } from '../../core/services/share.service';
import { MistakesService } from '../../core/services/mistakes.service';

@Component({
  selector: 'app-results',
  imports: [IonContent, IcoPipe, KeyValuePipe],
  templateUrl: './results.html',
})
export class ResultsPage implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private qs = inject(QuizStateService);
  private mistakes = inject(MistakesService);
  private shareSvc = inject(ShareService);
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
  explainingAll = signal(false);
  explainProgress = signal('');
  reviewing: any[] = [];
  questions: any[] = [];
  metaName = (t: string | number | symbol) => (TYPE_META as Record<string, any>)[String(t)]?.name || t;
  pctDisplay = signal('0%');
  readonly ringC = (2 * Math.PI * 76).toFixed(1);
  ringOffset = signal(2 * Math.PI * 76);
  get canExplain() { return hasApiKey() && loadSettings().aiExplain !== false; }

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

  async explainAll() {
    this.showReview.set(true);
    const pending = this.questions.map((q, i) => [q, i] as [any, number]).filter(([q]) => !q.explanation);
    if (!pending.length) { this.toast.toast('All answers already explained'); return; }
    this.explainingAll.set(true);
    let done = 0;
    for (const [q, i] of pending) {
      this.explainProgress.set(`Explaining ${done + 1}/${pending.length}…`);
      try {
        const text = await explainAnswer(q, this.reviewing[i]?.chosen ?? null);
        q.explanation = text;
      } catch { /* skip individual failures */ }
      done++;
    }
    this.explainingAll.set(false);
  }

  doExport() {
    const r = this.r();
    const ok = exportQuiz(r.docName || 'Quiz', r);
    if (!ok) this.toast.toast('Nothing to export');
  }

  share() { const r = this.r(); this.shareSvc.show({ title: r.docName, questions: r.questions, timerSec: r.cfg?.timerSec || 0, mode: 'quiz' }); }
  challenge() { const r = this.r(); this.shareSvc.show({ title: r.docName, questions: r.questions, timerSec: r.cfg?.timerSec || 0, mode: 'challenge', score: { percent: r.percent, correct: r.correct, total: r.total } }); }

  retake() {
    const r = this.r();
    if (r.mistakeMode) this.router.navigateByUrl('/tabs/library');
    else if (r.shared) {
      this.qs.sharedQuiz.set({ title: r.docName, questions: r.questions, cfg: r.cfg });
      this.router.navigateByUrl('/quiz');
    } else this.router.navigateByUrl('/quiz');
  }

  reviewMistakes() { this.mistakes.startMistakeReview(this.r().docId ?? undefined); }
  weakReview() { this.mistakes.startWeakReview(); }
  dueReview() { this.mistakes.startDueReview(); }
  alsoLike() { this.router.navigate(['/reviewer', this.suggestion().doc.id]); }
  goLibrary() { this.router.navigateByUrl('/tabs/library'); }
}

// small helper to lazily reach the MistakesService (avoids circular template deps)

