import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { saveSettings, listAccounts } from '../../core/engine/storage.js';
import { onboardingArt } from '../../shared/art.js';
import { assetUrl } from '../../shared/assets.js';

type Slide = (typeof SLIDES)[number];

const SLIDES = [
  {
    art: 'logo',
    eyebrow: 'Meet Quizard',
    title: 'Turn any document into practice',
    body: 'Your notes, slides and readings become instant quizzes. Study from what you already have — anywhere, even offline.',
    accent: 'purple'
  },
  {
    art: 'fileText',
    eyebrow: 'Any format',
    title: 'PDF, Word, PowerPoint & text',
    body: 'Drop a file or paste text. We extract the key ideas on-device in seconds — no upload, no account needed.',
    accent: 'blue'
  },
  {
    art: 'zap',
    eyebrow: 'Your way',
    title: 'Four question types, fully tunable',
    body: 'Multiple choice, true/false, fill-in-the-blank and identification. Set the count, difficulty and timer — then go.',
    accent: 'amber'
  },
  {
    art: 'lock',
    eyebrow: 'Private by design',
    title: 'Your data stays on this device',
    body: 'Your files, scores and questions are generated locally. AI question writing and wizard voice are optional cloud features — everything else works offline.',
    accent: 'green'
  }
];

@Component({
  selector: 'app-onboarding',
  imports: [],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
  host: { '(window:keydown)': 'onKey($event)' }
})
export class OnboardingPage implements OnDestroy {
  @ViewChild('slidesEl') slidesEl?: ElementRef<HTMLElement>;
  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  readonly heroUrl = assetUrl('wizard/wizard-image.jpg');
  readonly slides: Array<Slide & { artHtml: SafeHtml }>;
  idx = 0;
  exiting = false;
  private touchStartX: number | null = null;

  constructor(private router: Router, private sanitizer: DomSanitizer) {
    this.slides = SLIDES.map((s, i) => ({
      ...s,
      artHtml: this.sanitizer.bypassSecurityTrustHtml(i === 0 ? '' : onboardingArt[i])
    }));
  }

  get isLast() { return this.idx === SLIDES.length - 1; }

  ngOnDestroy() { /* listeners die with the component */ }

  private update() {
    const slides = this.slidesEl?.nativeElement;
    if (slides) {
      slides.style.transform = `translateX(-${this.idx * 100}%)`;
      [...slides.children].forEach((el, i) => el.classList.toggle('active', i === this.idx));
    }
  }

  private pressFx(btn: HTMLElement, e?: MouseEvent) {
    const ripple = document.createElement('span');
    ripple.className = 'press-ripple';
    if (e) {
      const r = btn.getBoundingClientRect();
      ripple.style.left = (e.clientX - r.left) + 'px';
      ripple.style.top = (e.clientY - r.top) + 'px';
    } else {
      ripple.style.left = '50%';
      ripple.style.top = '50%';
    }
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    btn.classList.remove('fly');
    void btn.offsetWidth;
    btn.classList.add('fly');
  }

  private pushFx(dir: number) {
    const vp = this.viewport?.nativeElement;
    if (!vp) return;
    vp.classList.remove('push-forward', 'push-back');
    void vp.offsetWidth;
    vp.classList.add(dir > 0 ? 'push-forward' : 'push-back');
  }

  next(e?: MouseEvent) {
    const btn = e?.currentTarget as HTMLElement | undefined;
    if (btn) this.pressFx(btn, e);
    if (this.idx < SLIDES.length - 1) { this.idx++; this.pushFx(1); this.update(); }
    else this.finish();
  }

  back(e?: MouseEvent) {
    if (this.idx > 0) {
      this.idx--;
      const btn = e?.currentTarget as HTMLElement | undefined;
      if (btn) this.pressFx(btn);
      this.pushFx(-1);
      this.update();
    }
  }


  // Ionic page transitions can swallow a navigateByUrl fired mid-animation;
  // retry until the URL actually changes.
  private nav(url: string, tries = 8) {
    this.router.navigateByUrl(url).then(ok => {
      if (!ok && tries > 0) setTimeout(() => this.nav(url, tries - 1), 250);
    });
  }

  async finish() {
    if (this.exiting) return;
    this.exiting = true;
    saveSettings({ onboarded: true });
    const accounts = await listAccounts();
    const fresh = !accounts.length || (accounts.length === 1 && accounts[0].name === 'My account');
    this.nav(fresh ? '/accounts?mode=create' : '/tabs/library');
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      if (this.idx < SLIDES.length - 1) { this.idx++; this.pushFx(1); this.update(); }
      else this.finish();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this.idx > 0) { this.idx--; this.pushFx(-1); this.update(); }
    } else if (e.key === 'Escape') {
      this.finish();
    }
  }

  onTouchStart(e: TouchEvent) { this.touchStartX = e.touches[0].clientX; }

  onTouchEnd(e: TouchEvent) {
    if (this.touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    if (dx < -45 && this.idx < SLIDES.length - 1) { this.idx++; this.pushFx(1); this.update(); }
    else if (dx > 45 && this.idx > 0) { this.idx--; this.pushFx(-1); this.update(); }
    this.touchStartX = null;
  }
}
