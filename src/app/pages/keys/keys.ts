import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { listKeys, saveKey, deleteKey } from '../../core/engine/storage.js';
import { parseKeyText } from '../../core/engine/answerkey.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { fmtDate } from '../../shared/helpers.js';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-keys',
  imports: [IonContent, IcoPipe],
  templateUrl: './keys.html',
})
export class KeysPage {
  router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  keys = signal<any[]>([]);
  sheetOpen = signal(false);
  editingId = signal<string | null>(null);

  subject = signal('');
  title = signal('');
  paste = signal('');

  readonly preview = computed(() => parseKeyText(this.paste()));
  readonly previewCount = computed(() => this.preview().items.length);
  readonly previewWithQuestions = computed(() => this.preview().items.filter(i => i.question).length);
  readonly dateOf = fmtDate;

  async ionViewWillEnter() { await this.load(); }
  ngOnInit() { this.ionViewWillEnter(); }

  async load() {
    this.keys.set(await listKeys());
  }

  openSheet(key: any = null) {
    this.editingId.set(key?.id || null);
    this.subject.set(key?.subject || '');
    this.title.set(key?.title || '');
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
    const subject = this.subject().trim();
    if (!subject || !this.previewCount()) return;
    const parsed = this.preview();
    await saveKey({
      id: this.editingId() || undefined,
      subject,
      title: this.title().trim(),
      format: parsed.format as 'qa' | 'answers' | 'letters',
      items: parsed.items,
    });
    this.sheetOpen.set(false);
    await this.load();
    const detail = parsed.format === 'qa' ? `${parsed.items.length} items (${this.previewWithQuestions()} with questions)`
      : parsed.format === 'letters' ? `${parsed.items.length} letter answers`
      : `${parsed.items.length} answers`;
    this.toast.toast(`Key saved — ${detail}`);
  }

  async remove(key: any) {
    if (!await this.confirm.confirm(`Delete the ${key.subject} key?`, 'Scanned results already saved are kept.', 'Delete')) return;
    await deleteKey(key.id);
    await this.load();
    this.toast.toast('Key deleted');
  }
}
