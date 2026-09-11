import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { buildQuizPayload, buildChallengePayload, encodeShare, linkFromEncoded } from '../engine/share.js';
import { renderQr } from '../engine/qr.js';

export interface ShareRequest {
  title: string; questions: any[]; timerSec?: number;
  mode?: 'quiz' | 'challenge'; score?: { percent: number; correct: number; total: number } | null;
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  private toast = inject(ToastService);
  readonly open = signal(false);
  readonly request = signal<ShareRequest | null>(null);

  show(req: ShareRequest) { this.request.set(req); this.open.set(true); }
  close() { this.open.set(false); }

  async buildLink(req: ShareRequest, challenger?: { name: string; percent: number; correct: number; total: number } | null): Promise<string> {
    const payload = req.mode === 'challenge' && challenger
      ? buildChallengePayload(req.title, req.questions, challenger, { timerSec: req.timerSec })
      : buildQuizPayload(req.title, req.questions, { timerSec: req.timerSec });
    const encoded = await encodeShare(payload);
    return linkFromEncoded(encoded);
  }

  renderQrInto(el: HTMLElement, url: string) { try { renderQr(el, url); } catch { el.innerHTML = ''; } }

  async copy(url: string) {
    try { await navigator.clipboard.writeText(url); this.toast.toast('Link copied'); }
    catch { this.toast.toast('Could not copy', true); }
  }

  async nativeShare(req: ShareRequest, url: string) {
    if (navigator.share) {
      try { await navigator.share({ title: req.title || 'Quiz', text: req.mode === 'challenge' ? 'Can you beat my score?' : 'Try this quiz', url }); } catch { /* cancelled */ }
    } else await this.copy(url);
  }
}
