import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { getClass, listSheets, listQuizzes } from '../../core/engine/storage.js';
import { fmtDate, scorePill } from '../../shared/helpers.js';
import { IcoPipe } from '../../shared/ico.pipe';

// One scanned sheet, resolved to the roster student it belongs to.
interface StudentRecord {
  quizId: string;
  quiz: string;
  percent: number;
  correct: number;
  total: number;
  date: number;
}

// Class roster page: back header, class summary and the numbered student
// list. Each row carries that student's recorded scores for this class —
// the latest attempt per quiz as a chip, tap to expand every attempt with
// dates. Edit roster hands off to the Classes tab via ?edit=<id>.
@Component({
  selector: 'app-class-roster',
  imports: [IonContent, IcoPipe],
  templateUrl: './class-roster.html',
})
export class ClassRosterPage {
  router = inject(Router);
  private route = inject(ActivatedRoute);

  cls = signal<any>(null);
  missing = signal(false);
  expandedId = signal<string | null>(null);
  private sheets = signal<any[]>([]);
  private quizNames = signal<Map<string, string>>(new Map());

  readonly students = computed(() =>
    (this.cls()?.students || []).slice().sort((a: any, b: any) => (a.no || 0) - (b.no || 0)));

  readonly checkedCount = computed(() => this.sheets().length);

  // Records grouped per roster student, newest first. Matching is by roster
  // number (stable across renames), falling back to the name for any record
  // saved without one.
  readonly recordsByStudent = computed(() => {
    const map = new Map<string, { all: StudentRecord[]; latest: StudentRecord[] }>();
    for (const st of this.students()) {
      const all = this.sheets()
        .filter(s => s.studentNo === st.no || (!s.studentNo && s.studentName === st.name))
        .map(s => ({
          quizId: s.quizId,
          quiz: this.quizNames().get(s.quizId) || 'Quiz',
          percent: s.percent, correct: s.correct, total: s.total, date: s.createdAt,
        }))
        .sort((a, b) => b.date - a.date);
      const seen = new Set<string>();
      map.set(st.id, { all, latest: all.filter(r => !seen.has(r.quizId) && seen.add(r.quizId)) });
    }
    return map;
  });

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    const cls = id ? await getClass(id) : null;
    this.cls.set(cls);
    this.missing.set(!cls);
    this.expandedId.set(null);
    if (!cls) { this.sheets.set([]); return; }
    const [sheets, quizzes] = await Promise.all([listSheets({ classId: cls.id }), listQuizzes()]);
    this.sheets.set(sheets);
    this.quizNames.set(new Map(quizzes.map((q: any) => [q.id, q.subject + (q.title ? ' — ' + q.title : '')])));
  }

  records(st: any) {
    return this.recordsByStudent().get(st.id) || { all: [], latest: [] };
  }
  pill = scorePill;
  fmtDate = fmtDate;
  toggle(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  edit() {
    if (this.cls()) this.router.navigateByUrl('/tabs/classes?edit=' + this.cls().id);
  }
}
