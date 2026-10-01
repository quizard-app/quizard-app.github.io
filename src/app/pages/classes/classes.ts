import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { listClasses, saveClass, deleteClass, getActiveAccountId, getAccount } from '../../core/engine/storage.js';
import { parseRoster } from '../../core/engine/roster.js';
import { icon } from '../../shared/icons.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-classes',
  imports: [IonContent, IcoPipe],
  templateUrl: './classes.html',
})
export class ClassesPage {
  router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  account = this.ui.account;
  classes = signal<any[]>([]);
  sheetOpen = signal(false);
  editingId = signal<string | null>(null);

  name = signal('');
  grade = signal('');
  section = signal('');
  paste = signal('');

  readonly previewCount = computed(() => parseRoster(this.paste()).students.length);
  readonly previewSkipped = computed(() => parseRoster(this.paste()).skipped);
  readonly totalStudents = computed(() => this.classes().reduce((s, c) => s + (c.students?.length || 0), 0));

  async ionViewWillEnter() {
    if (!this.ui.account()) {
      const id = getActiveAccountId() || localStorage.getItem('quizard-active-account');
      if (id) this.ui.account.set(await getAccount(id) || null);
    }
    await this.load();
  }

  ngOnInit() { this.ionViewWillEnter(); }

  async load() {
    this.classes.set(await listClasses());
  }

  openSheet(cls: any = null) {
    this.editingId.set(cls?.id || null);
    this.name.set(cls?.name || '');
    this.grade.set(cls?.grade || '');
    this.section.set(cls?.section || '');
    this.paste.set('');
    this.sheetOpen.set(true);
  }

  closeSheet() { this.sheetOpen.set(false); }

  setPaste(value: string) { this.paste.set(value); }

  async onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    this.paste.set(this.paste() ? this.paste() + '\n' + text : text);
    input.value = '';
    this.toast.toast(`Loaded ${file.name}`);
  }

  async saveSheet() {
    const name = this.name().trim();
    if (!name) return;
    const parsed = parseRoster(this.paste());
    if (!parsed.students.length) {
      this.toast.toast('Paste or upload at least one student name', true);
      return;
    }
    await saveClass({
      id: this.editingId() || undefined,
      name,
      grade: this.grade().trim(),
      section: this.section().trim(),
      students: parsed.students.map(s => ({
        name: s.name,
        grade: s.grade || this.grade().trim(),
        section: s.section || this.section().trim(),
      })),
    });
    this.sheetOpen.set(false);
    await this.load();
    this.toast.toast(`${parsed.students.length} students saved to “${name}”`);
  }

  async remove(cls: any) {
    if (!await this.confirm.confirm(`Delete “${cls.name}”?`, 'The roster will be removed. Saved scan results are kept.', 'Delete')) return;
    await deleteClass(cls.id);
    await this.load();
    this.toast.toast('Class deleted');
  }
}
