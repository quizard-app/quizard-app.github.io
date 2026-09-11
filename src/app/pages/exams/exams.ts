import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { getExam, listExams, deleteExam, getDoc, listDueCards, getWeakTerms } from '../../core/engine/storage.js';
import { buildExamQuiz, countdownLabel, rankExamTopics } from '../../core/engine/exam.js';
import { assetUrl } from '../../shared/assets.js';
import { exportExamPdf } from '../../core/engine/export.js';
import { icon } from '../../shared/icons.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { QuizStateService } from '../../core/services/quiz-state.service';

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

  readonly wizImg = assetUrl('wizard/wizard-thinking.jpg');
  detailId = signal<string | null>(null);
  exams = signal<any[]>([]);
  exam = signal<any>(null);
  detailBody = signal('');
  buildingPdf = signal(false);
  practiceCount = signal(0);
  private builtQuiz: any = null;

  async ngOnInit() {
    // /exams/:id → detail; /exams → list
    const id = this.route.snapshot.paramMap.get('id');
    this.detailId.set(id);
    if (id) await this.loadDetail(id);
    else await this.loadList();
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

  private async loadDetail(examId: string) {
    const exam = await getExam(examId);
    if (!exam) { this.router.navigateByUrl('/exams'); return; }
    this.exam.set(exam);
    const [docs, due, weak] = await Promise.all([
      Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null))),
      listDueCards(60).catch(() => []),
      getWeakTerms(null).catch(() => [])
    ]);
    const realDocs = docs.filter(Boolean);
    const docWeak = weak.filter((w: any) => (exam.docIds || []).includes(w.docId));
    const cd = countdownLabel(exam.examDate);
    this.detailCountdown.set(cd ? `${exam.examDate ? new Date(exam.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' : ''}${cd}` : `${realDocs.length} files · ${exam.topics.length} topics`);
    this.detailCd.set(cd);
    this.detailDocs.set(realDocs);
    this.builtQuiz = buildExamQuiz(exam, realDocs, docWeak, { count: 15 });
    this.practiceCount.set(this.builtQuiz.questions.length);
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
    const [docs, due, weak] = await Promise.all([
      Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null))),
      listDueCards(60).catch(() => []),
      getWeakTerms(null).catch(() => [])
    ]);
    const realDocs = docs.filter(Boolean);
    const docWeak = weak.filter((w: any) => (exam.docIds || []).includes(w.docId));
    const quiz = this.builtQuiz || buildExamQuiz(exam, realDocs, docWeak, { count: 15 });
    if (!quiz.questions.length) return;
    this.qs.examSession.set({ examId: exam.id, questions: quiz.questions, docName: exam.title });
    this.qs.currentDocId.set(null);
    this.qs.sharedQuiz.set(null);
    this.qs.mistakeReview.set(null);
    this.router.navigateByUrl('/quiz');
  }

  async exportPdf() {
    const exam = this.exam();
    if (!exam) return;
    this.buildingPdf.set(true);
    try {
      const docs = (await Promise.all((exam.docIds || []).map((id: string) => getDoc(id).catch(() => null)))).filter(Boolean);
      await exportExamPdf(exam, docs);
      this.toast.toast('Exam PDF downloaded ✓');
    } catch { this.toast.toast('Could not build the PDF', true); }
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
