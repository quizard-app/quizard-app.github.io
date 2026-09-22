import { Injectable, inject, signal } from '@angular/core';
import { getApiKey, setApiKey } from '../engine/gemini.js';
import { ToastService } from './toast.service';

// Global "bring your own key" prompt. Reachable from anywhere (homepage
// button, reviewer error bar) and opens automatically when the AI relay runs
// out of requests, so the user can keep going with a free personal key.
@Injectable({ providedIn: 'root' })
export class ByokService {
  private toast = inject(ToastService);

  visible = signal(false);
  reason = signal('');
  keyInput = signal('');
  status = signal('');
  testing = signal(false);
  // true when the relay recently failed — highlights the Settings/Homepage entry
  aiDown = signal(false);

  open(reason = '') {
    this.reason.set(reason);
    this.keyInput.set('');
    this.status.set(getApiKey()
      ? 'A personal key is already saved on this device — paste a new one to replace it.'
      : '');
    this.visible.set(true);
  }

  close() { this.visible.set(false); }

  // user declines — stop auto-prompting for this browser session
  dismiss() {
    sessionStorage.setItem('quizard-byok-dismissed', '1');
    this.close();
  }

  // Call from AI-failure paths. Skip-list: only offline/timeout/content errors
  // (where a personal key can't help) are ignored; everything else prompts once.
  // Matches raw engine messages too (network_error, fetch failures, blocked_*).
  notifyAiFailure(reason: string) {
    const r = String(reason || '').toLowerCase();
    if (/timeout|offline|network_error|network|fetch|not_enough_content|author_empty|blocked_|empty_response/.test(r)) return;
    this.aiDown.set(true);
    if (this.visible()) return;
    if (sessionStorage.getItem('quizard-byok-dismissed')) return;
    const r2 = String(reason || '').toLowerCase();
    this.open(r2 === 'quota'
      ? 'The built-in AI relay is out of requests right now. Add your own free Gemini key to keep AI features running — it stays on this device.'
      : 'The built-in AI is having trouble right now. Add your own free Gemini key to keep AI features running — it stays on this device.');
  }

  // call after a successful AI response so highlights clear
  notifyAiOk() { this.aiDown.set(false); }

  typeKey(v: string) { this.keyInput.set(v); }

  save() {
    const val = this.keyInput().trim();
    if (!val) { this.status.set('Paste a key first — get a free one at aistudio.google.com/apikey'); return; }
    setApiKey(val);
    this.visible.set(false);
    this.aiDown.set(false);
    this.toast.toast('Personal key saved ✓ — used as a backup when the relay is busy');
  }

  remove() {
    setApiKey('');
    this.status.set('Personal key removed — the built-in relay handles AI.');
    this.toast.toast('Personal key removed');
  }
}
