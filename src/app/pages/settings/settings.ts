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
import { ByokService } from '../../core/services/byok.service';
import { encryptBackup, decryptBackup } from '../../core/engine/crypto-backup.js';
import { generateSyncCode, getSyncInfo, turnOffSync, activateSync, pushSync, pullSync, changeSyncPassword } from '../../core/engine/sync.js';
import { normalizeSyncCode } from '../../core/engine/sync.js';
import { hashPin, verifyPin, updateAccount } from '../../core/engine/storage.js';

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
  readonly byok = inject(ByokService);

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

  // ── Cloud sync (sync-code locker) ──
  syncInfo = signal<{ code: string; lastPush: number; on: boolean }>({ code: '', lastPush: 0, on: false });
  syncPanel = signal<'' | 'new' | 'restore'>('');
  newCode = signal(generateSyncCode());
  syncPass = '';
  restoreCode = '';
  restorePass = '';
  syncBusy = signal(false);
  syncMsg = signal('');

  private refreshSyncInfo() {
    this.syncInfo.set(getSyncInfo());
  }

  syncLastPush() {
    const t = this.syncInfo().lastPush;
    return t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'never';
  }

  ngOnInitSyncRestore() {
    // deep link: /tabs/settings?sync=restore (Welcome → "I have a sync code")
    try {
      const q = new URLSearchParams(this.router.url.split('?')[1] || '');
      if (q.get('sync') === 'restore') { this.syncPanel.set('restore'); this.router.navigate([], { queryParams: { sync: null }, replaceUrl: true }).catch(() => {}); }
    } catch { /* ignore */ }
  }

  openSyncPanel(mode: 'new' | 'restore') {
    this.syncMsg.set('');
    if (mode === 'new') this.newCode.set(generateSyncCode());
    this.syncPanel.set(mode);
  }
  closeSyncPanel() { this.syncPanel.set(''); this.syncMsg.set(''); this.syncPass = ''; this.restoreCode = ''; this.restorePass = ''; }
  regenCode() { this.newCode.set(generateSyncCode()); }

  async activateSyncNow() {
    this.syncBusy.set(true);
    this.syncMsg.set('');
    try {
      await activateSync(this.newCode(), this.syncPass);
      this.refreshSyncInfo();
      this.closeSyncPanel();
      this.toast.toast('Sync is on — your library is on the cloud locker ✓');
    } catch (err: any) {
      this.syncMsg.set(String(err?.message || 'Sync failed'));
    } finally {
      this.syncBusy.set(false);
    }
  }

  async syncNow() {
    const info = this.syncInfo();
    this.syncBusy.set(true);
    this.syncMsg.set('');
    try {
      await pushSync({ code: info.code, passphrase: getSyncInfo().passphrase });
      this.refreshSyncInfo();
      this.toast.toast('Library pushed to the cloud locker ✓');
    } catch (err: any) {
      this.syncMsg.set(String(err?.message || 'Sync failed'));
    } finally {
      this.syncBusy.set(false);
    }
  }

  async restoreFromSync() {
    const code = normalizeSyncCode(this.restoreCode);
    this.syncBusy.set(true);
    this.syncMsg.set('');
    try {
      const out = await pullSync(code, this.restorePass);
      this.refreshSyncInfo();
      this.closeSyncPanel();
      this.docCount = (await listDocs()).length;
      this.toast.toast(`Restored — ${out.docs ?? '?'} documents merged ✓`);
    } catch (err: any) {
      this.syncMsg.set(String(err?.message || 'Restore failed'));
    } finally {
      this.syncBusy.set(false);
    }
  }

  async turnOffSyncAsk() {
    if (!await this.confirm.confirm('Turn off sync on this device?', 'The cloud locker keeps its last snapshot until it expires — this only stops this device from pushing.', 'Turn off')) return;
    turnOffSync();
    this.refreshSyncInfo();
    this.toast.toast('Sync turned off on this device');
  }

  // ── Change sync password (kill switch: old password stops working) ──
  syncPassPanel = signal(false);
  syncOldPass = '';
  syncNewPass = '';
  syncNewPass2 = '';

  openSyncPassPanel() {
    this.syncOldPass = '';
    this.syncNewPass = '';
    this.syncNewPass2 = '';
    this.syncMsg.set('');
    this.syncPassPanel.set(true);
  }
  closeSyncPassPanel() {
    this.syncPassPanel.set(false);
    this.syncOldPass = '';
    this.syncNewPass = '';
    this.syncNewPass2 = '';
  }

  async submitSyncPassword() {
    this.syncBusy.set(true);
    this.syncMsg.set('');
    try {
      await changeSyncPassword(this.syncOldPass, this.syncNewPass);
      this.closeSyncPassPanel();
      this.toast.toast('Password changed — the old one no longer opens the cloud copy ✓');
    } catch (err: any) {
      this.syncMsg.set(String(err?.message || 'Password change failed'));
    } finally {
      this.syncBusy.set(false);
    }
  }

  // ── Change profile PIN ──
  pinPanel = signal(false);
  pinOld = '';
  pinNew = '';
  pinNew2 = '';
  pinBusy = signal(false);
  pinMsg = signal('');

  openPinChange() {
    this.pinOld = '';
    this.pinNew = '';
    this.pinNew2 = '';
    this.pinMsg.set('');
    this.pinPanel.set(true);
  }
  closePinPanel() {
    this.pinPanel.set(false);
    this.pinOld = '';
    this.pinNew = '';
    this.pinNew2 = '';
  }

  async submitPinChange() {
    const acc = this.account;
    if (!acc) return;
    if (!/^\d{4}$/.test(this.pinNew)) { this.pinMsg.set('The PIN must be exactly 4 digits'); return; }
    if (this.pinNew !== this.pinNew2) { this.pinMsg.set('The two new PINs do not match'); return; }
    this.pinBusy.set(true);
    this.pinMsg.set('');
    try {
      if (acc.pinHash) {
        const res = await verifyPin(this.pinOld, acc.pinHash);
        if (!res.ok) { this.pinMsg.set('Current PIN is wrong'); return; }
      }
      const pinHash = await hashPin(this.pinNew);
      await updateAccount(acc.id, { pinHash });
      await this.renderAccountSection();
      this.closePinPanel();
      this.toast.toast('Profile PIN updated ✓');
    } catch (err: any) {
      this.pinMsg.set(String(err?.message || 'Could not update the PIN'));
    } finally {
      this.pinBusy.set(false);
    }
  }

  async ngOnInit() {
    this.docCount = (await listDocs()).length;
    await this.renderAccountSection();
    this.renderKeyStatus();
    this.refreshSyncInfo();
    this.ngOnInitSyncRestore();
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
    // Fresh devices auto-create a default account without ever writing the
    // localStorage id, so fall back to the first existing account.
    this.accounts = await listAccounts();
    const acc = this.ui.account()
      || await getAccount(localStorage.getItem('quizard-active-account') || '')
      || await getAccount(getActiveAccountId() || '')
      || (this.accounts.length ? await getAccount(this.accounts[0].id) : null);
    this.account = acc || null;
  }

  saveKey() {
    const val = this.keyInput.trim();
    if (!val) { this.renderKeyStatus('Paste a key first — get a free one at aistudio.google.com/apikey'); return; }
    setApiKey(val);
    this.keyInput = '';
    this.byok.notifyAiOk();
    this.renderKeyStatus('Key saved ✓ — AI now uses your key first');
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
    if (res.ok) { this.byok.notifyAiOk(); this.toast.toast('Gemini OK ✓'); }
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
    if (!await this.confirm.confirm('Delete profile?', 'All documents, quizzes, history, and mistakes for this profile will be permanently removed.', 'Delete', target.name)) return;
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
