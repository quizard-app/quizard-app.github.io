import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { payloadFromHash, consumeShareHash } from '../../core/engine/share.js';
import { saveDeck } from '../../core/engine/storage.js';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { ToastService } from '../../core/services/toast.service';
import { IcoPipe } from '../../shared/ico.pipe';

// Landing screen for inbound share/challenge links (#quiz=…). Decodes the
// payload baked into the URL, offers Start / Save to library / Copy link,
// then consumes the hash so a refresh doesn't re-trigger it.
@Component({
  selector: 'app-shared',
  imports: [IonContent, IcoPipe],
  template: `
    <ion-content [fullscreen]="true">
      <div class="screen screen-center">
        @if (phase() === 'loading') {
          <div class="empty-state">
            <p class="faint">Opening shared quiz…</p>
          </div>
        } @else if (phase() === 'error') {
          <div class="empty-state">
            <div class="art"><span [innerHTML]="'alert' | ico"></span></div>
            <h3>We couldn't open that quiz</h3>
            <p>{{ errorMsg() }}</p>
            <button class="btn btn-primary" (click)="goLibrary()" style="max-width:220px;margin:0 auto">Go to Library</button>
          </div>
        } @else if (payload(); as p) {
          <div class="empty-state" style="max-width:420px">
            <div class="art"><span [innerHTML]="(isChallenge() ? 'users' : 'share') | ico"></span></div>
            <h3 style="margin-top:14px">{{ title() }}</h3>
            <p class="faint">{{ count() }} question{{ count() === 1 ? '' : 's' }} · no app or account needed to play</p>
            @if (isChallenge() && p.c) {
              <div class="challenge-banner">
                <div class="cb-avatar">{{ (p.c.n || '?')[0].toUpperCase() }}</div>
                <div class="cb-text"><strong>{{ p.c.n || 'Friend' }}</strong> scored <strong>{{ p.c.p }}%</strong>@if (p.c.t) { ({{ p.c.c }}/{{ p.c.t }}) }.</div>
              </div>
              <p class="faint" style="margin-top:10px">Can you beat them?</p>
            }
            <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center">
              <button class="btn btn-primary" (click)="start()"><span [innerHTML]="'play' | ico"></span> {{ isChallenge() ? 'Take the challenge' : 'Start quiz' }}</button>
              <button class="btn btn-secondary" (click)="save()" [disabled]="saved()"><span [innerHTML]="(saved() ? 'check' : 'layers') | ico"></span> {{ saved() ? 'Saved' : 'Save to library' }}</button>
              <button class="btn btn-secondary" (click)="copy()"><span [innerHTML]="'link' | ico"></span> Copy link</button>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
})
export class SharedPage implements OnInit {
  private router = inject(Router);
  private qs = inject(QuizStateService);
  private toast = inject(ToastService);

  phase = signal<'loading' | 'ready' | 'error'>('loading');
  payload = signal<any>(null);
  errorMsg = signal('Invalid link');
  saved = signal(false);
  private sourceUrl = '';

  title = () => this.payload()?.t || 'Shared Quiz';
  count = () => (this.payload()?.q || []).length;
  isChallenge = () => !!this.payload()?.c;

  async ngOnInit() {
    this.sourceUrl = location.href;
    try {
      const payload = await payloadFromHash(location.hash);
      if (!payload) { this.router.navigateByUrl('/tabs/library'); return; }
      if (!payload.q?.length) throw new Error('This quiz link has no questions in it.');
      this.payload.set(payload);
      // Consume the hash only on success — a broken link stays intact so it
      // can be re-shared or inspected.
      consumeShareHash();
      this.phase.set('ready');
    } catch (e: any) {
      this.errorMsg.set(e?.message || 'Invalid link');
      this.phase.set('error');
    }
  }

  start() {
    const p = this.payload();
    if (!p) return;
    this.qs.sharedQuiz.set({
      title: p.t || 'Shared Quiz',
      questions: p.q,
      cfg: { timerSec: p.ts || 0 },
      challenge: p.c || null
    });
    this.router.navigateByUrl('/quiz');
  }

  async save() {
    const p = this.payload();
    if (!p || this.saved()) return;
    try {
      await saveDeck({ name: p.t || 'Shared Quiz', questions: p.q, source: p.c ? 'challenge' : 'shared' });
      this.saved.set(true);
      this.toast.toast('Saved to your library');
    } catch {
      this.toast.toast('Could not save', true);
    }
  }

  async copy() {
    try { await navigator.clipboard.writeText(this.sourceUrl); this.toast.toast('Link copied'); }
    catch { this.toast.toast('Could not copy', true); }
  }

  goLibrary() { this.router.navigateByUrl('/tabs/library'); }
}
