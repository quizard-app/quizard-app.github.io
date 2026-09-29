import { Injectable, inject, signal } from '@angular/core';
import { getApiKey, setApiKey } from '../engine/gemini.js';
import { PROVIDERS, getAiConfig, setAiConfig } from '../engine/ai-providers.js';
import { ToastService } from './toast.service';

// the registry comes from a .js engine module — string-keyed access needs the
// index-signature view
const REGISTRY = PROVIDERS as Record<string, any>;

// Global "bring your own key" prompt. Reachable from anywhere (homepage
// button, reviewer error bar) and opens automatically when the AI relay runs
// out of requests, so the user can keep going with a free personal key.
// Supports several providers: Gemini (default) plus OpenRouter, Groq, OpenAI,
// Anthropic and any custom OpenAI-compatible endpoint — pick one, paste its
// key (and for custom, a base URL + model name).
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

  readonly providerList = Object.values(REGISTRY);
  provider = signal<string>('gemini');
  model = signal<string>('');
  baseUrl = signal<string>('');

  get providerConfig() {
    return REGISTRY[this.provider()] || PROVIDERS.gemini;
  }

  open(reason = '') {
    this.reason.set(reason);
    const cfg = getAiConfig();
    this.provider.set(cfg.provider);
    this.model.set(cfg.model);
    this.baseUrl.set(cfg.baseUrl);
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

  chooseProvider(id: string) {
    if (!REGISTRY[id] || id === this.provider()) return;
    this.provider.set(id);
    // switching providers drops the model override so the new provider's
    // default applies (a Groq model name means nothing to OpenRouter)
    this.model.set('');
    if (id !== 'custom') this.baseUrl.set('');
  }

  setModel(v: string) { this.model.set(v); }
  setBaseUrl(v: string) { this.baseUrl.set(v); }

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
      ? 'The built-in AI relay is out of requests right now. Add your own free AI key to keep AI features running — it stays on this device.'
      : 'The built-in AI is having trouble right now. Add your own free AI key to keep AI features running — it stays on this device.');
  }

  // call after a successful AI response so highlights clear
  notifyAiOk() { this.aiDown.set(false); }

  typeKey(v: string) { this.keyInput.set(v); }

  save() {
    const val = this.keyInput().trim();
    if (!val) { this.status.set('Paste a key first — tap the button above to get one free.'); return; }
    const p = this.providerConfig;
    if (p.id === 'custom') {
      if (!this.baseUrl().trim()) { this.status.set('Add your provider\u2019s base URL first (e.g. https://api.deepseek.com/v1).'); return; }
      if (!this.model().trim()) { this.status.set('Add the model name your provider expects.'); return; }
    }
    setApiKey(val);
    setAiConfig({ provider: this.provider(), model: this.model().trim(), baseUrl: this.baseUrl().trim() });
    this.visible.set(false);
    this.aiDown.set(false);
    this.toast.toast(`Key saved ✓ — AI now uses your ${p.label} key first`);
  }

  remove() {
    setApiKey('');
    this.status.set('Personal key removed — the built-in relay handles AI.');
    this.toast.toast('Personal key removed');
  }
}
