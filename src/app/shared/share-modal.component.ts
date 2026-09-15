import { Component, effect, inject, signal, viewChild, ElementRef, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IcoPipe } from './ico.pipe';
import { ShareService, type ShareRequest } from '../core/services/share.service';

// Full-screen share/challenge modal — the whole quiz is baked into the link
// so a recipient needs no app, account, or API key.
@Component({
  selector: 'app-share-modal',
  imports: [FormsModule, IcoPipe],
  template: `
    @if (share.request(); as req) {
      <div class="modal-mask" (click)="share.close()">
        <div class="modal share-modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3><span [innerHTML]="(req.mode === 'challenge' ? 'users' : 'share') | ico"></span> {{ req.mode === 'challenge' ? 'Challenge a friend' : 'Share this quiz' }}</h3>
            <button class="icon-btn" (click)="share.close()" [innerHTML]="'x' | ico"></button>
          </div>
          @if (req.mode === 'challenge') {
            <label class="share-field">
              <span>Your name</span>
              <input class="text-input" [(ngModel)]="name" value="You" maxlength="20" placeholder="Your name" (input)="rebuild()" />
            </label>
            <p class="faint" style="margin:4px 0 0;font-size:13px">They'll see you scored <strong>{{ req.score?.percent || 0 }}%</strong>. Can they beat it?</p>
          }
          <div class="qr-wrap" #qr></div>
          <label class="share-field">
            <span>Link</span>
            <input class="text-input" readonly [value]="link() || (building() ? 'Building link…' : '')" />
          </label>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="share.copy(link())"><span [innerHTML]="'link' | ico"></span> Copy link</button>
            <button class="btn btn-primary" (click)="share.nativeShare(req, link())"><span [innerHTML]="'share' | ico"></span> Share…</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ShareModalComponent {
  share = inject(ShareService);
  name = 'You';
  link = signal('');
  building = signal(false);
  // Signal query (not @ViewChild): re-resolves when the @if block renders,
  // so the effect below retries the build once the QR container exists.
  private qrEl = viewChild<ElementRef<HTMLElement>>('qr');

  constructor() {
    effect(() => {
      // Re-run when the modal opens AND when the QR container renders.
      const isOpen = this.share.open();
      const qr = this.qrEl();
      if (!isOpen) { untracked(() => { this.link.set(''); this.building.set(false); }); return; }
      if (!qr) return; // container not rendered yet — effect re-fires when it is
      void this.rebuild();
    });
  }

  // Monotonic token so overlapping rebuilds (fast typing in the name
  // field) can't land out of order.
  private buildSeq = 0;

  async rebuild() {
    const req: ShareRequest | null = this.share.request();
    const qr = this.qrEl();
    if (!req || !qr) return;
    const seq = ++this.buildSeq;
    this.building.set(true);
    const challenger = req.mode === 'challenge'
      ? { name: (this.name || 'You').trim(), percent: req.score?.percent || 0, correct: req.score?.correct || 0, total: req.score?.total || 0 }
      : null;
    const url = await this.share.buildLink(req, challenger);
    // The modal may have closed (or re-rendered) while encoding — only paint
    // into the currently-mounted container, and only the latest build wins.
    const live = this.qrEl();
    if (seq === this.buildSeq && this.share.open() && this.share.request() === req && live) {
      this.link.set(url);
      this.share.renderQrInto(live.nativeElement, url);
    }
    this.building.set(false);
  }
}
