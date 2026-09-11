import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import {
  exportAll, importAll, clearAllData, storageUsage, saveSettings, loadSettings,
  listDocs, listAccounts, getAccount, deleteAccount, setActiveAccount,
  getActiveAccountId, accountHasData
} from '../../core/engine/storage.js';
import { testApiKey, getApiKey, setApiKey, hasApiKey, hasRelay } from '../../core/engine/gemini.js';
import { maybeScheduleReminders } from '../../core/services/reminders.js';
import { icon } from '../../shared/icons.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { encryptBackup, decryptBackup } from '../../core/engine/crypto-backup.js';

const BACKUP_NUDGE_MS = 30 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-settings',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './settings.html',
})
export class SettingsPage implements OnInit {
  router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  @ViewChild('importInput') importInput?: ElementRef<HTMLInputElement>;
  @ViewChild('encImportInput') encImportInput?: ElementRef<HTMLInputElement>;

  s = loadSettings();
  lastBackup = this.s.lastBackupAt || null;
  docCount = 0;
  accounts: any[] = [];
  account: any = null;
  usageLine = signal('');
  keyStatus = signal('');
  keyInput = '';
  testing = false;
  explaining = this.s.aiExplain !== false;
  remindersOn = this.s.reminders === true;
  readonly icons = {
    logo: icon('logo'), refresh: icon('refresh'), download: icon('download'),
    database: icon('database'), lock: icon('lock'), trash: icon('trash'), check: icon('check'), plus: icon('plus')
  };

  get showNudge() { return (!this.lastBackup || Date.now() - this.lastBackup > BACKUP_NUDGE_MS) && this.docCount > 0; }
  get version() { return '1.1'; }
  get theme() { return this.ui.theme; }

  async ngOnInit() {
    this.docCount = (await listDocs()).length;
    await this.renderAccountSection();
    this.renderKeyStatus();
    try {
      const usage = await storageUsage();
      const line = `Last backup: ${this.lastBackup ? new Date(this.lastBackup).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'never'}${usage ? ' · ' + usage : ''}`;
      this.usageLine.set(line);
    } catch { /* usage optional */ }
  }

  private renderKeyStatus(msg?: string) {
    this.keyStatus.set(msg || (hasRelay()
      ? `Built-in relay ready${getApiKey() ? ' · personal backup key saved' : ''}.`
      : getApiKey()
        ? 'No relay configured — using your personal key.'
        : 'No relay and no key — quizzes still work with built-in rules.'));
  }

  private async renderAccountSection() {
    const acc = this.ui.account() || await getAccount(localStorage.getItem('quizard-active-account') || '');
    this.account = acc || null;
    this.accounts = await listAccounts();
  }

  saveKey() {
    const val = this.keyInput.trim();
    if (!val) { this.renderKeyStatus('Paste a key first — get a free one at aistudio.google.com/apikey'); return; }
    setApiKey(val);
    this.keyInput = '';
    this.renderKeyStatus('Key saved ✓ — used only if the relay keys are ever all busy.');
    this.toast.toast('Personal backup key saved ✓');
  }
  removeKey() {
    setApiKey('');
    this.renderKeyStatus('Personal key removed — the built-in relay handles AI.');
    this.toast.toast('Personal key removed');
  }
  async testKey() {
    this.testing = true;
    this.renderKeyStatus('Testing…');
    const res = await testApiKey();
    this.testing = false;
    this.renderKeyStatus(res.ok
      ? `✓ Gemini reachable — model ${res.model}`
      : res.message === 'no_key' || res.message === 'No key'
        ? 'Save your key first — aistudio.google.com/apikey'
        : `✗ ${res.message}`);
    if (res.ok) this.toast.toast('Gemini OK ✓');
  }
  setExplain(on: boolean) { this.explaining = on; saveSettings({ aiExplain: on }); }

  async toggleReminders(on: boolean) {
    this.remindersOn = on;
    saveSettings({ reminders: on });
    if (on) {
      const r = await maybeScheduleReminders();
      if (!r.enabled) { this.toast.toast(r.reason || 'Reminders unavailable', true); this.remindersOn = false; saveSettings({ reminders: false }); }
      else this.toast.toast('Reminders on ✓');
    } else this.toast.toast('Reminders off');
  }
  setWizardVoice(on: boolean) { saveSettings({ wizardVoice: on }); }
  setSkipIntro(on: boolean) { saveSettings({ skipIntro: on }); this.toast.toast(on ? 'Intro will be skipped' : 'Intro plays on launch'); }

  replayIntro() { saveSettings({ onboarded: false }); this.router.navigateByUrl('/onboarding'); }
  async replayTour() {
    let aid = this.ui.account()?.id || getActiveAccountId() || localStorage.getItem('quizard-active-account');
    if (!aid) {
      const accs = await listAccounts();
      if (accs.length) { aid = accs[0].id; setActiveAccount(aid); this.ui.account.set(accs[0]); }
    } else if (!getActiveAccountId()) {
      setActiveAccount(aid);
      if (!this.ui.account()) { try { this.ui.account.set(await getAccount(aid) || null); } catch {} }
    }
    saveSettings({ tutorialDone: false, tourSeen: [] });
    this.router.navigateByUrl('/tutorial');
  }

  switchAccount() {
    setActiveAccount(null);
    this.ui.account.set(null);
    this.router.navigate(['/accounts', { mode: 'picker' }]);
  }
  addAccount() { this.router.navigate(['/accounts'], { queryParams: { mode: 'create', from: 'picker' } }); }

  async removeAccountFlow() {
    const others = this.accounts.filter(a => a.id !== this.account?.id);
    const name = window.prompt(`Type the profile name to remove:\n\n${others.map(o => '· ' + o.name).join('\n')}`);
    if (!name) return;
    const target = others.find(o => o.name.toLowerCase() === name.trim().toLowerCase());
    if (!target) { this.toast.toast('No profile with that name', true); return; }
    if (!await this.confirm.confirm(`Delete "${target.name}"?`, `All documents, quizzes and mistakes for <b>${target.name}</b> will be permanently removed.`)) return;
    await deleteAccount(target.id);
    this.toast.toast(`Removed ${target.name}`);
    await this.renderAccountSection();
  }

  private downloadJson(data: any, suffix: string) {
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    a.href = url;
    a.download = `quizard-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}${suffix}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async exportBackup() {
    try {
      this.downloadJson(await exportAll(), '');
      this.toast.toast('Backup downloaded ✓');
      this.lastBackup = Date.now();
      saveSettings({ lastBackupAt: this.lastBackup });
      try { this.usageLine.set(`Last backup: ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`); } catch {}
    } catch (err: any) { this.toast.toast('Export failed: ' + err.message, true); }
  }

  onImportPicked(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        await importAll(JSON.parse(fr.result as string));
        this.toast.toast('Backup restored ✓');
      } catch (err: any) { this.toast.toast('Import failed: ' + (err?.message || 'invalid file'), true); }
    };
    fr.readAsText(file);
  }

  async exportEncrypted() {
    const passphrase = window.prompt('Choose a passphrase for this backup (required):');
    if (!passphrase) return;
    try {
      const data = await exportAll();
      const encrypted = await encryptBackup(data, passphrase);
      this.downloadJson(encrypted, '.encrypted');
      this.toast.toast('Encrypted backup downloaded ✓');
    } catch (err: any) { this.toast.toast('Encryption failed: ' + (err?.message || ''), true); }
  }

  onEncImportPicked(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const passphrase = window.prompt('Passphrase for this backup:');
    if (!passphrase) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const data = await decryptBackup(JSON.parse(fr.result as string), passphrase);
        await importAll(data);
        this.toast.toast('Encrypted backup restored ✓');
      } catch { this.toast.toast('Wrong passphrase or corrupted file', true); }
    };
    fr.readAsText(file);
  }

  async eraseAll() {
    if (!await this.confirm.confirm('Erase everything?', 'All documents, quizzes, history and mistakes will be permanently deleted.', 'Erase')) return;
    await clearAllData();
    this.toast.toast('All data erased');
    this.docCount = 0;
  }

  clearCache() {
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload());
    } else location.reload();
  }
}
