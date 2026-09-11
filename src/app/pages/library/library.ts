import { Component, computed, inject, signal } from '@angular/core';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { Router, NavigationEnd } from '@angular/router';
import { IonContent, IonSkeletonText, IonRefresher, IonRefresherContent } from '@ionic/angular';
import { IonMenuButton } from '@ionic/angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  getActiveAccountId, getAccount, listDocs, deleteDoc, loadSettings, saveSettings, deriveFolders, deriveTags, listDecks, deleteDeck, listExams, saveDeck
} from '../../core/engine/storage.js';
import { countdownLabel } from '../../core/engine/exam.js';
import { assetUrl } from '../../shared/assets.js';
import { icon } from '../../shared/icons.js';
import { typeLabel, scorePill, fmtDate } from '../../shared/helpers.js';
import { emptyLibraryArt } from '../../shared/art.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { QuizStateService } from '../../core/services/quiz-state.service';

const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'name', label: 'A–Z' },
  { id: 'score', label: 'Best score' }
];

@Component({
  selector: 'app-library',
  imports: [IonMenuButton, TooltipDirective, IonContent, IonSkeletonText, IonRefresher, IonRefresherContent, IcoPipe],
  templateUrl: './library.html',
})
export class LibraryPage {
  private router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private quizState = inject(QuizStateService);

  readonly icoLog = icon('logo');
  readonly heroImg = assetUrl('wizard/wizard-studying.jpg');
  readonly emptyArt = emptyLibraryArt;
  readonly account = this.ui.account;
  readonly sorts = SORTS;

  loading = signal(true);
  docs = signal<any[]>([]);
  decks = signal<any[]>([]);
  nextExam = signal<any>(null);
  folders = signal<string[]>([]);
  tags = signal<string[]>([]);

  query = signal('');
  sort = signal<string>('recent');
  folderFilter = signal<string | null>(null);
  tagFilter = signal<string | null>(null);

  readonly totalAttempts = computed(() => this.docs().reduce((s, d) => s + (d.attempts || 0), 0));
  readonly avg = computed(() => {
    const scored = this.docs().filter(d => d.bestScore != null);
    return scored.length ? Math.round(scored.reduce((s, d) => s + d.bestScore, 0) / scored.length) : null;
  });
  readonly subtitle = computed(() => {
    const avg = this.avg();
    if (!this.totalAttempts()) return 'Pick a document and forge your first quiz.';
    if (avg != null && avg >= 80) return 'Mastery within reach — keep the streak alive.';
    if (avg != null && avg >= 50) return 'Steady progress. Review your weak spots to level up.';
    if (avg != null) return 'Every miss banks a lesson — review and try again.';
    return 'Your quizzes are waiting.';
  });

  readonly visibleDocs = computed(() => {
    let arr = this.docs().slice();
    const ff = this.folderFilter(), tf = this.tagFilter(), q = this.query().toLowerCase(), sort = this.sort();
    if (ff) arr = arr.filter(d => d.folder === ff);
    if (tf) arr = arr.filter(d => (d.tags || []).includes(tf));
    if (q) arr = arr.filter(d => d.name.toLowerCase().includes(q));
    if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'score') arr.sort((a, b) => (b.bestScore ?? -1) - (a.bestScore ?? -1));
    else arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  });

  constructor() {
    // re-run load whenever this tab becomes active
    const router = this.router;
    const active = toSignal(router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(router.url)
    ));
    // load once; tab re-entry re-runs via ionViewWillEnter-equivalent below
    void active;
  }

  async ionViewWillEnter() {
    if (!this.ui.account()) {
      const id = getActiveAccountId() || localStorage.getItem('quizard-active-account');
      if (id) this.ui.account.set(await getAccount(id) || null);
    }
    this.loading.set(true);
    const docs = await listDocs();
    this.docs.set(docs);
    this.decks.set(await listDecks().catch(() => []));
    const exams = await listExams().catch(() => []);
    this.nextExam.set(exams.find((e: any) => (e.status || 'upcoming') === 'upcoming') || null);
    this.folders.set(deriveFolders(docs));
    this.tags.set(deriveTags(docs));
    this.sort.set(loadSettings().sortDocs || 'recent');
    this.loading.set(false);
  }

  ngOnInit() { this.ionViewWillEnter(); }

  async refresh(ev: Event) {
    await this.ionViewWillEnter();
    (ev as CustomEvent).detail?.complete?.();
  }

  countdown(exam: any) { return countdownLabel(exam.examDate); }
  typeOf(doc: any) { return typeLabel(doc.type); }
  pillOf(doc: any) { return doc.bestScore != null ? scorePill(doc.bestScore) : ''; }
  dateOf(ts: number) { return fmtDate(ts); }
  iconSvg = (name: string) => icon(name);

  setSort(id: string) {
    this.sort.set(id);
    saveSettings({ sortDocs: id });
  }

  setFolder(f: string | null) { this.folderFilter.set(f || null); }
  setTag(t: string | null) { this.tagFilter.set(t || null); }

  openDoc(doc: any) { this.router.navigate(['/doc', doc.id]); }
  startQuiz(doc: any) { this.router.navigate(['/doc', doc.id, 'setup']); }
  openReviewer(doc: any) { this.router.navigate(['/reviewer', doc.id]); }
  openSettings() { this.router.navigateByUrl('/tabs/settings'); }
  openAccounts() { this.router.navigate(['/accounts', { mode: 'picker' }]); }
  openImport() { this.router.navigateByUrl('/tabs/import'); }
  openExams() { this.router.navigateByUrl('/exams'); }
  openExamDetail(exam: any) { this.router.navigate(['/exams', exam.id]); }

  async removeDoc(doc: any) {
    if (!await this.confirm.confirm(`Delete "${doc.name}"?`, `All quiz history for <b>${doc.name}</b> will be removed.`)) return;
    await deleteDoc(doc.id);
    this.toast.toast('Document deleted');
    this.ionViewWillEnter();
  }

  playDeck(deck: any) {
    this.quizState.sharedQuiz.set({ title: deck.name, questions: deck.questions, cfg: deck.cfg || { timerSec: 0 } });
    this.router.navigateByUrl('/quiz');
  }

  async removeDeck(deck: any) {
    await deleteDeck(deck.id).catch(() => {});
    this.decks.update(list => list.filter(d => d.id !== deck.id));
    // undo toast — the lesson's reversible-destructive pattern
    this.toast.action('Saved quiz deleted', 'Undo', async () => {
      await saveDeck(deck).catch(() => {});
      this.ionViewWillEnter();
    });
  }

  // template helpers for innerHTML art
  readonly emptyArtHtml = emptyLibraryArt;
}
