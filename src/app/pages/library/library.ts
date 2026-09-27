import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonMenuButton } from '@ionic/angular';
import { filter, map, startWith } from 'rxjs';
import {
  getActiveAccountId, getAccount, listDocs, deleteDoc, restoreDoc, purgeDeletedDoc, loadSettings, saveSettings, deriveFolders, deriveTags, listExams, updateDoc, listAttempts
} from '../../core/engine/storage.js';
import { folderCounts, mergeFolders } from '../../core/engine/taxonomy.js';
import { countdownLabel } from '../../core/engine/exam.js';
import { assetUrl } from '../../shared/assets.js';
import { icon } from '../../shared/icons.js';
import { typeLabel, scorePill, fmtDate } from '../../shared/helpers.js';
import { emptyLibraryArt } from '../../shared/art.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ByokService } from '../../core/services/byok.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'name', label: 'A–Z' },
  { id: 'score', label: 'Best score' }
];

@Component({
  selector: 'app-library',
  imports: [IonMenuButton, IonContent, IcoPipe],
  templateUrl: './library.html',
})
export class LibraryPage {
  private router = inject(Router);
  ui = inject(UiStateService);
  readonly byok = inject(ByokService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly icoLog = icon('logo');
  readonly heroImg = assetUrl('wizard/wizard-studying.jpg');
  readonly emptyArt = emptyLibraryArt;
  readonly account = this.ui.account;
  readonly sorts = SORTS;

  loading = signal(true);
  docs = signal<any[]>([]);
  nextExam = signal<any>(null);
  folders = signal<string[]>([]);
  tags = signal<string[]>([]);
  // rounds finished in the last 7 days (docs + exam practice)
  weekTaken = signal(0);

  // Bulk organize: select documents in the grid, then move/unfile/delete them
  // in one action instead of editing each document's page.
  selectMode = signal(false);
  selected = signal<Set<string>>(new Set());
  moveOpen = signal(false);
  newFolderName = signal('');

  query = signal('');
  private searchTimer: any = null;
  sort = signal<string>('recent');
  folderFilter = signal<string | null>(null);
  tagFilter = signal<string | null>(null);

  readonly totalAttempts = computed(() => this.docs().reduce((s, d) => s + (d.attempts || 0), 0));
  readonly selectedCount = computed(() => this.selected().size);
  readonly folderDocCounts = computed(() => folderCounts(this.docs()));
  readonly folderCount = (f: string) => this.folderDocCounts().get(f) || 0;
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



  async ionViewWillEnter() {
    if (!this.ui.account()) {
      const id = getActiveAccountId() || localStorage.getItem('quizard-active-account');
      if (id) this.ui.account.set(await getAccount(id) || null);
    }
    this.loading.set(true);
    const docs = await listDocs();
    this.docs.set(docs);
    const exams = await listExams().catch(() => []);
    this.nextExam.set(exams.find((e: any) => (e.status || 'upcoming') === 'upcoming') || null);
    this.folders.set(mergeFolders(deriveFolders(docs), loadSettings().customFolders || []));
    this.tags.set(deriveTags(docs));
    this.sort.set(loadSettings().sortDocs || 'recent');
    try {
      const weekAgo = Date.now() - 7 * 864e5;
      const attempts = await listAttempts(null);
      this.weekTaken.set(attempts.filter((a: any) => a.date >= weekAgo).length);
    } catch { this.weekTaken.set(0); }
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

  searchNow(value: string) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.query.set(value.trim()), 120);
  }
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
    if (!await this.confirm.confirm('Delete document?', 'This also removes its quiz history, mistakes, and saved progress.', 'Delete', doc.name)) return;
    const id = doc.id;
    await deleteDoc(id);
    await this.ionViewWillEnter();
    this.toast.toast('Document deleted', false, {
      text: 'Undo',
      handler: async () => {
        await restoreDoc(id);
        await this.ionViewWillEnter();
      }
    });
    setTimeout(() => { void purgeDeletedDoc(id); }, 8000);
  }

  // ── Bulk organize (select mode) ──
  moveMode = signal<'move' | 'create'>('move');

  toggleSelectMode() {
    if (this.selectMode()) this.exitSelect();
    else this.selectMode.set(true);
  }
  exitSelect() {
    this.selectMode.set(false);
    this.selected.set(new Set());
    this.moveOpen.set(false);
  }
  toggleSelected(id: string) {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selected.set(next);
  }
  selectAllVisible() {
    const next = new Set(this.selected());
    for (const d of this.visibleDocs()) next.add(d.id);
    this.selected.set(next);
  }

  private persistCustomFolder(name: string) {
    const custom = loadSettings().customFolders || [];
    if (!custom.includes(name)) saveSettings({ customFolders: [...custom, name] });
  }

  openMoveSheet() { this.moveMode.set('move'); this.newFolderName.set(''); this.moveOpen.set(true); }
  openCreateFolder() { this.moveMode.set('create'); this.newFolderName.set(''); this.moveOpen.set(true); }

  async moveTo(folder: string | null) {
    const ids = [...this.selected()];
    if (!ids.length) return;
    for (const id of ids) await updateDoc(id, { folder });
    this.moveOpen.set(false);
    this.exitSelect();
    await this.ionViewWillEnter();
    this.toast.toast(folder ? `Moved ${ids.length} document${ids.length === 1 ? '' : 's'} to ${folder}` : `Removed ${ids.length} document${ids.length === 1 ? '' : 's'} from folders`);
  }

  async createAndMove() {
    const name = this.newFolderName().trim();
    if (!name) return;
    this.persistCustomFolder(name);
    await this.moveTo(name);
  }

  async createFolder() {
    const name = this.newFolderName().trim();
    if (!name) return;
    this.persistCustomFolder(name);
    this.moveOpen.set(false);
    await this.ionViewWillEnter();
    this.toast.toast(`Folder "${name}" created`);
  }

  async unfileSelected() {
    const ids = [...this.selected()];
    if (!ids.length) return;
    for (const id of ids) await updateDoc(id, { folder: null });
    this.exitSelect();
    await this.ionViewWillEnter();
    this.toast.toast(`Removed ${ids.length} document${ids.length === 1 ? '' : 's'} from folders`);
  }

  async deleteSelected() {
    const ids = [...this.selected()];
    if (!ids.length) return;
    const docs = this.docs().filter(d => ids.includes(d.id));
    const names = docs.slice(0, 3).map(d => d.name).join(', ') + (docs.length > 3 ? ` +${docs.length - 3} more` : '');
    if (!await this.confirm.confirm(`Delete ${ids.length} document${ids.length === 1 ? '' : 's'}?`, 'This also removes their quiz history, mistakes, and saved progress.', 'Delete', names)) return;
    for (const id of ids) await deleteDoc(id);
    this.exitSelect();
    await this.ionViewWillEnter();
    this.toast.toast(`${ids.length} document${ids.length === 1 ? '' : 's'} deleted`, false, {
      text: 'Undo',
      handler: async () => {
        for (const id of ids) await restoreDoc(id);
        await this.ionViewWillEnter();
      }
    });
    setTimeout(() => { for (const id of ids) void purgeDeletedDoc(id); }, 8000);
  }

  async removeFolder(f: string, ev: Event) {
    ev.stopPropagation();
    if (!await this.confirm.confirm(`Remove folder "${f}"?`, 'Documents inside are kept — they just become unfiled.', 'Remove folder')) return;
    for (const d of this.docs().filter(d => d.folder === f)) await updateDoc(d.id, { folder: null });
    const custom = ((loadSettings().customFolders || []) as string[]).filter(x => x !== f);
    saveSettings({ customFolders: custom });
    if (this.folderFilter() === f) this.setFolder(null);
    await this.ionViewWillEnter();
    this.toast.toast(`Folder "${f}" removed`);
  }

  // template helpers for innerHTML art
  readonly emptyArtHtml = emptyLibraryArt;
}
