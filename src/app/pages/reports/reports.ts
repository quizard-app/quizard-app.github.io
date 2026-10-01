import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { listSheets, listClasses, listQuizzes, getQuiz, type SheetResult } from '../../core/engine/storage.js';
import { itemAnalysis, weakestItems, resultsCsv } from '../../core/engine/reports.js';
import { exportClassReportPdf } from '../../core/engine/export.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { fmtDate } from '../../shared/helpers.js';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-reports',
  imports: [IonContent, IcoPipe],
  templateUrl: './reports.html',
})
export class ReportsPage {
  router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  sheets = signal<SheetResult[]>([]);
  classes = signal<any[]>([]);
  selectedClassId = signal<string | null>(null);
  selectedQuizId = computed(() => this.classSheets()[0]?.quizId ?? null);

  readonly dateOf = fmtDate;

  classAvgOf(classId: string) {
    const list = this.sheets().filter(s => s.classId === classId);
    return list.length ? Math.round(list.reduce((sum, s) => sum + s.percent, 0) / list.length) : 0;
  }

  async ionViewWillEnter() {
    await this.refresh();
  }

  async refresh() {
    const [sheets, classes] = await Promise.all([listSheets(), listClasses()]);
    this.sheets.set(sheets);
    // classes that have checked sheets, in check order
    const withSheets = classes.filter(c => sheets.some(s => s.classId === c.id));
    this.classes.set(withSheets);
    if (this.selectedClassId() && !withSheets.some(c => c.id === this.selectedClassId())) {
      this.selectedClassId.set(null);
    }
  }

  readonly selectedClass = computed(() => this.classes().find(c => c.id === this.selectedClassId()) || null);
  readonly classSheets = computed(() =>
    this.sheets().filter(s => s.classId === this.selectedClassId()));
  readonly classAvg = computed(() => {
    const s = this.classSheets();
    return s.length ? Math.round(s.reduce((sum, x) => sum + x.percent, 0) / s.length) : 0;
  });
  readonly best = computed(() => this.classSheets().slice().sort((a, b) => b.percent - a.percent)[0] || null);
  readonly hardest = computed(() => this.classSheets().slice().sort((a, b) => a.percent - b.percent)[0] || null);

  readonly quiz = signal<any>(null);
  readonly analysis = computed(() => {
    const q = this.quiz();
    if (!q) return [];
    return itemAnalysis(this.classSheets(), q.items);
  });
  readonly weak = computed(() => {
    const q = this.quiz();
    if (!q) return [];
    return weakestItems(this.classSheets(), q.items, 5);
  });

  async openClass(id: string) {
    this.selectedClassId.set(id);
    const quizId = this.sheets().find(s => s.classId === id)?.quizId;
    this.quiz.set(quizId ? await getQuiz(quizId) : null);
  }

  backToOverview() { this.selectedClassId.set(null); this.quiz.set(null); }

  async exportCsv() {
    const quiz = this.quiz();
    if (!quiz) return;
    const csv = resultsCsv(this.classSheets(), quiz.items);
    this.download(`quizard-results-${slug(this.selectedClass()?.name)}.csv`, csv, 'text/csv');
    this.toast.toast('CSV downloaded ✓');
  }

  async exportPdf() {
    const cls = this.selectedClass(), quiz = this.quiz();
    if (!cls || !quiz) return;
    await exportClassReportPdf(cls, quiz, this.classSheets(), this.analysis());
    this.toast.toast('Report PDF downloaded ✓');
  }

  async removeSheet(s: SheetResult) {
    if (!await this.confirm.confirm(`Remove ${s.studentName}'s result?`, 'The sheet scan will be deleted.', 'Remove')) return;
    const { deleteSheet } = await import('../../core/engine/storage.js');
    await deleteSheet(s.id);
    await this.refresh();
    if (this.selectedClassId()) await this.openClass(this.selectedClassId()!);
    this.toast.toast('Result removed');
  }

  private download(filename: string, content: string, mime: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
}

function slug(name: string) {
  return String(name || 'class').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'class';
}
