import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { getExam, listExams, deleteExam, getDoc, listDueCards, getWeakTerms } from '../../core/engine/storage.js';
import { buildExamQuiz, countdownLabel, rankExamTopics } from '../../core/engine/exam.js';
import { authorExamQuiz } from '../../core/engine/quiz-ai.js';
import { assetUrl } from '../../shared/assets.js';
import { exportExamPdf } from '../../core/engine/export.js';
import { icon } from '../../shared/icons.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-exams',
  imports: [IonContent, IcoPipe],
  templateUrl: './exams.html',
})
export class ExamsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private qs = inject(QuizStateService);
  private navCtrl = inject(NavController);

  readonly wizImg = assetUrl('wizard/wizard-thinking.jpg');
  detailId = signal<string | null>(null);
  exams = signal<any[]>([]);
  exam = signal<any>(null);
  detailBody = signal('');
  buildingPdf = signal(false);
  practiceCount = signal(0);
  questionCount = signal(20);
  // AI scenario authoring runs in the background: the offline-built quiz is
  // ready instantly and the AI result replaces it when it lands.
  aiBuilding = signal(false);
  aiFailed = signal(false);
  aiProgress = signal({ done: 0, total: 0 });
  private builtQuiz: any = null;
  private aiToken = 0;
  private aiPromise: Promise<any> | null = null;
  private lastDocWeak: any[] = [];

  async ngOnInit() {
    // /exams/:id → detail; /exams → list
    const id = this.route.snapshot.paramMap.get('id');
    this.detailId.set(id);
    if (id) await this.loadDetail(id);
    else await this.loadList();
  }

  // The input drives BOTH the practice quiz and the PDF handout, so a change
  // rebuilds the cached quiz instead of only affecting the export.
  setQuestionCount(n: number) {
    const count = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 100) : this.questionCount();
    this.questionCount.set(count);
    const exam = this.exam();
    if (!exam) { this.practiceCount.set(count); return; }
    this.rebuildQuiz();
  }

  private async rebuildQuiz() {
    const exam = this.exam();
    if (!exam) return;
    const [docs, due, weak] = await Promise.all([
      Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null))),
      listDueCards(60).catch(() => []),
      getWeakTerms(null).catch(() => [])
    ]);
    const realDocs = docs.filter(Boolean);
    const docWeak = weak.filter((w: any) => (exam.docIds || []).includes(w.docId));
    this.lastDocWeak = docWeak;
    this.builtQuiz = buildExamQuiz(exam, realDocs, docWeak, { count: this.questionCount() });
    this.practiceCount.set(this.builtQuiz.questions.length);
    this.startAiBuild(exam, realDocs, docWeak);
  }

  // Kick the background AI authoring (scenario questions per topic per file).
  // A token discards stale results when the exam or the count changes.
  private startAiBuild(exam: any, realDocs: any[], docWeak: any[]) {
    const token = ++this.aiToken;
    this.aiBuilding.set(true);
    this.aiFailed.set(false);
    this.aiPromise = authorExamQuiz(exam, realDocs, { count: this.questionCount(), weakTerms: docWeak },
      (done: number, t: number) => { if (token === this.aiToken) this.aiProgress.set({ done, total: t }); });
    this.aiPromise.then(gen => {
      if (token !== this.aiToken) return;
      this.aiBuilding.set(false);
      const good = (gen?.questions?.length || 0) >= Math.max(4, Math.ceil(this.questionCount() / 2));
      if (good) {
        this.builtQuiz = gen;
        this.practiceCount.set(gen.questions.length);
      } else {
        this.aiFailed.set(true);
      }
    }).catch(() => {
      if (token !== this.aiToken) return;
      this.aiBuilding.set(false);
      this.aiFailed.set(true);
    });
  }

  private async loadList() {
    const exams = await listExams();
    this.exams.set(exams);
  }

  cdOf(e: any) { return countdownLabel(e.examDate); }
  iconSvg = (n: string) => icon(n);

  goChat() { this.router.navigateByUrl('/exam-chat'); }
  openExamDetail(exam: any) { this.router.navigate(['/exams', exam.id]); }
  backTo() { this.router.navigateByUrl(this.detailId() ? '/exams' : '/tabs/library'); }

  private   async loadDetail(examId: string) {
    const exam = await getExam(examId);
    if (!exam) { this.router.navigateByUrl('/exams'); return; }
    // Exams saved by the pre-fix offline matcher stored topics with OBJECT
    // titles ({title: {title, ...}}) — normalize every shape to string titles.
    exam.topics = (exam.topics || []).map((t: any) => {
      const base = typeof t === 'string' ? { title: t } : t;
      let title = base?.title;
      if (typeof title !== 'string') title = title?.title ?? title?.name ?? '';
      return { ...base, title: String(title) };
    }).filter((t: any) => t.title);
    this.exam.set(exam);
    const [docs, due, weak] = await Promise.all([
      Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null))),
      listDueCards(60).catch(() => []),
      getWeakTerms(null).catch(() => [])
    ]);
    const realDocs = docs.filter(Boolean);
    const docWeak = weak.filter((w: any) => (exam.docIds || []).includes(w.docId));
    this.lastDocWeak = docWeak;
    const cd = countdownLabel(exam.examDate);
    this.detailCountdown.set(cd ? `${exam.examDate ? new Date(exam.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' : ''}${cd}` : `${realDocs.length} files · ${exam.topics.length} topics`);
    this.detailCd.set(cd);
    this.detailDocs.set(realDocs);
    this.builtQuiz = buildExamQuiz(exam, realDocs, docWeak, { count: this.questionCount() });
    this.practiceCount.set(this.builtQuiz.questions.length);
    this.startAiBuild(exam, realDocs, docWeak);
    const ranked = rankExamTopics(exam, realDocs);
    void ranked;
    const body = `
      ${cd && cd !== 'past' ? `<div class="exam-banner ${cd === 'today' || cd === 'tomorrow' ? 'urgent' : ''}">${cd === 'today' ? 'The exam is TODAY' : `The exam is ${cd}`}</div>` : ''}
      ${exam.announcement ? `<div class="rvw-part"><div class="rvw-part-head"><span class="rvw-num">✦</span><h3>Announcement</h3></div><p class="rvw-overview">${exam.announcement.replace(/</g, '&lt;')}</p></div>` : ''}
      ${exam.topics.length ? `<div class="rvw-part"><div class="rvw-part-head"><span class="rvw-num">I</span><h3>Topics to review</h3></div>
        ${exam.topics.map((t: any) => {
          const doc = realDocs.find((d: any) => d.id === t.docId);
          const weakHere = docWeak.filter((w: any) => doc && w.docId === doc.id).length;
          const reason = t.reason || (doc ? `Covered in ${doc.name}` : '');
          return `<div class="ec-topic"><div class="ec-topic-title">${t.title.replace(/</g, '&lt;')}</div><div class="ec-topic-reason">${reason.replace(/</g, '&lt;')}${weakHere ? ` · <span style="color:var(--bad)">${weakHere} weak spot${weakHere === 1 ? '' : 's'}</span>` : ''}</div></div>`;
        }).join('')}
      </div>` : ''}
      ${realDocs.length ? `<div class="rvw-part"><div class="rvw-part-head"><span class="rvw-num">II</span><h3>Your files (${realDocs.length})</h3></div>
        <div class="chip-row">${realDocs.map((d: any) => `<span class="chip">${d.name.replace(/</g, '&lt;')}</span>`).join('')}</div></div>` : ''}
      ${!this.practiceCount() ? '<p class="faint" style="font-size:12px">Not enough content in these files to build a quiz yet.</p>' : ''}
    `;
    this.detailBody.set(body);
  }

  detailCountdown = signal('');
  detailCd = signal('');
  detailDocs = signal<any[]>([]);

  async startPractice() {
    const exam = this.exam();
    if (!exam || !this.practiceCount()) return;
    // Give a still-running AI build a short grace period, then fall back to
    // whatever is ready (the offline quiz is always available).
    if (this.aiBuilding() && this.aiPromise) {
      const settled = await Promise.race([
        this.aiPromise.catch(() => null),
        new Promise(r => setTimeout(() => r(null), 20000))
      ]);
      if (settled?.questions?.length && settled.questions.length >= (this.builtQuiz?.questions?.length || 0)) {
        this.builtQuiz = settled;
        this.practiceCount.set(settled.questions.length);
      } else {
        this.toast.toast('Starting with built-in questions — AI scenarios still crafting', true);
      }
    }
    const quiz = this.builtQuiz || buildExamQuiz(exam, this.detailDocs(), this.lastDocWeak, { count: this.questionCount() });
    if (!quiz.questions.length) return;
    this.qs.examSession.set({ examId: exam.id, questions: quiz.questions, docName: exam.title });
    this.qs.currentDocId.set(null);
    this.qs.mistakeReview.set(null);
    this.navCtrl.setDirection('root', false);
    this.router.navigateByUrl('/quiz-review');
  }

  async exportPdf() {
    const exam = this.exam();
    if (!exam) return;
    this.buildingPdf.set(true);
    try {
      const docs = (await Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null)))).filter(Boolean);
      const [due, weak] = await Promise.all([
        listDueCards(60).catch(() => []),
        getWeakTerms(null).catch(() => [])
      ]);
      const realDocs = docs.filter(Boolean);
      const docWeak = weak.filter((w: any) => (exam.docIds || []).includes(w.docId));
      this.lastDocWeak = docWeak;
      // The cached quiz (AI scenarios when they landed, offline otherwise) so
      // the handout matches what practice serves.
      const quiz = this.builtQuiz || buildExamQuiz(exam, realDocs, docWeak, { count: this.questionCount() });
      const examWithQuestions = { ...exam, questions: quiz.questions };
      await exportExamPdf(examWithQuestions, docs);
      this.toast.toast('Exam PDF downloaded ✓');
    } catch (error) {
      console.error('PDF export error:', error);
      this.toast.toast('Could not build the PDF', true);
    }
    this.buildingPdf.set(false);
  }

  async removeExam() {
    const exam = this.exam();
    if (!exam) return;
    if (!await this.confirm.confirm(`Delete "${exam.title}"?`, 'The exam plan will be removed. Your documents and quiz history stay.')) return;
    await deleteExam(exam.id);
    this.toast.toast('Exam deleted');
    this.router.navigateByUrl('/exams');
  }
}
