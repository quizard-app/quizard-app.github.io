import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { loadSettings, saveSettings } from '../../core/engine/storage.js';
import { assetUrl } from '../../shared/assets.js';
import { UiStateService } from '../../core/services/ui-state.service';

// Static screenshot tutorial — swipeable deck with glowing highlights and
// wizard narration. Port of legacy tutorial.js.
const SLIDES = [
  { screen: 'library-empty', img: assetUrl('wizard/slides/slide-1-library-empty.jpg'), mp3: 'tut-library-empty', portrait: 'tut-add', title: 'Your Library', text: 'Welcome! Tap the + to add your first PDF, Word or text file — I\'ll turn its pages into instant practice quizzes.', highlight: null, accent: 'purple' },
  { screen: 'library-tour', img: assetUrl('wizard/slides/slide-2-library-tour.jpg'), mp3: 'tut-library-tour', portrait: 'tut-add', title: 'Your Library', text: 'This is your Library — tap + to add a document, or tap Quiz on any document to start studying.', highlight: null, accent: 'purple' },
  { screen: 'import', img: assetUrl('wizard/slides/slide-3-import.jpg'), mp3: 'tut-import', portrait: 'tut-import', title: 'Add a Document', text: 'Drop a file or paste text here. Your document is processed locally — I read it and craft questions from the key ideas.', highlight: null, accent: 'blue' },
  { screen: 'setup', img: assetUrl('wizard/slides/slide-4-setup.jpg'), mp3: 'tut-setup', portrait: 'tut-setup', title: 'Quiz Setup', text: 'Pick how many questions and which styles fit your goal, then hit Start Quiz. You can tweak difficulty and focus your weak spots anytime.', highlight: { x: 10, y: 73, w: 80, h: 7, label: 'Start Quiz' }, accent: 'amber' },
  { screen: 'quiz-first', img: assetUrl('wizard/slides/slide-5-quiz-first.jpg'), mp3: 'tut-quiz-first', portrait: 'tut-quiz', title: 'Answer Questions', text: 'Read each question carefully and choose the best answer — I\'ll show you why afterwards.', highlight: null, accent: 'blue' },
  { screen: 'quiz-correct', img: assetUrl('wizard/slides/slide-6-quiz-correct.jpg'), mp3: 'tut-quiz-correct', portrait: 'tut-correct', title: 'Correct!', text: 'Well reasoned — that\'s the right one! Tap Next Question to continue.', highlight: null, accent: 'green' },
  { screen: 'quiz-wrong', img: assetUrl('wizard/slides/slide-7-quiz-wrong.jpg'), mp3: 'tut-quiz-wrong', portrait: 'tut-wrong', title: 'Not Quite', text: 'Not quite — here\'s the reasoning so it sticks next time. Review the explanation and tap Next.', highlight: null, accent: 'amber' },
  { screen: 'progress', img: assetUrl('wizard/slides/slide-8-progress.jpg'), mp3: 'tut-progress-first', portrait: 'tut-progress', title: 'Your Progress', text: 'This is your progress map — streaks, scores and the terms you stumble on. Revisit weak spots to master the subject.', highlight: null, accent: 'purple' },
  { screen: 'quiz-done', img: assetUrl('wizard/slides/slide-9-quiz-done.jpg'), mp3: 'tut-quiz-done', portrait: 'tut-done', title: 'All Done!', text: 'First trial complete! Practice these and the weak spots fade. You can replay this tour anytime in Settings.', highlight: null, accent: 'green' }
];

// Narration loads lazily: current + next slide only.
const audioCache = new Map<string, HTMLAudioElement>();
let audioEl: HTMLAudioElement | null = null;
let audioUnlocked = false;
let pendingPlayName: string | null = null;

function cacheAudio(name: string) {
  if (audioCache.has(name)) return;
  const a = new Audio();
  a.preload = 'auto';
  a.src = assetUrl(`wizard/${name}.mp3`);
  a.load();
  audioCache.set(name, a);
}

function preloadAudioAround(idx: number) {
  cacheAudio(SLIDES[idx].mp3);
  if (SLIDES[idx + 1]) cacheAudio(SLIDES[idx + 1].mp3);
}

function setupAudioUnlock() {
  if (audioUnlocked) return;
  const unlock = () => {
    audioUnlocked = true;
    if (pendingPlayName) { const n = pendingPlayName; pendingPlayName = null; playAudio(n); }
  };
  addEventListener('click', unlock, { once: true });
  addEventListener('touchstart', unlock, { once: true });
  addEventListener('keydown', unlock, { once: true });
}

function voiceOn() { return loadSettings().wizardVoice !== false; }

function playAudio(name: string) {
  if (!voiceOn()) return Promise.resolve();
  const cached = audioCache.get(name);
  if (!audioEl) { audioEl = new Audio(); audioEl.preload = 'auto'; }
  try {
    audioEl.src = cached ? cached.src : assetUrl(`wizard/${name}.mp3`);
    audioEl.volume = 1;
    audioEl.muted = false;
    const p = audioEl.play();
    if (p && p.catch) p.catch((err: any) => { if (err && err.name === 'NotAllowedError') pendingPlayName = name; });
    return new Promise<void>(resolve => {
      audioEl!.onended = () => { audioEl!.onended = null; resolve(); };
      audioEl!.onerror = () => { audioEl!.onerror = null; resolve(); };
      setTimeout(resolve, 15000);
    });
  } catch { return Promise.resolve(); }
}

function stopAudio() { if (audioEl) { try { audioEl.pause(); } catch {} } }

@Component({
  selector: 'app-tutorial',
  imports: [],
  templateUrl: './tutorial.html',
  host: { '(window:keydown)': 'onKey($event)' }
})
export class TutorialPage implements OnDestroy {
  private router = inject(Router);
  private ui = inject(UiStateService);
  @ViewChild('slidesEl') slidesEl?: ElementRef<HTMLElement>;
  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  readonly slides = SLIDES;
  idx = 0;
  exiting = false;
  private touchStartX: number | null = null;

  constructor() {
    preloadAudioAround(0);
    setupAudioUnlock();
  }

  ngOnDestroy() { stopAudio(); }

  get isLast() { return this.idx === SLIDES.length - 1; }
  portraitUrl(s: typeof SLIDES[number]) { return assetUrl(`wizard/${s.portrait}.jpg`); }

  loadSlideImage(i: number) {
    const img = this.slidesEl?.nativeElement.children[i]?.querySelector('img[data-src]') as HTMLImageElement | null;
    if (img) { img.src = img.dataset['src'] || ''; img.removeAttribute('data-src'); }
  }

  async finish() {
    if (this.exiting) return;
    this.exiting = true;
    stopAudio();
    const aid = this.ui.account()?.id || null;
    const doneMap = { ...(loadSettings().tutorialDoneAccounts || {}) };
    if (aid) doneMap[aid] = true;
    saveSettings({ tutorialDone: true, tutorialDoneAccounts: doneMap });
    this.router.navigateByUrl('/tabs/library');
  }

  update() {
    const slides = this.slidesEl?.nativeElement;
    if (slides) {
      slides.style.transform = `translateX(-${this.idx * 100}%)`;
      [...slides.children].forEach((el, i) => el.classList.toggle('active', i === this.idx));
    }
    this.loadSlideImage(this.idx);
    if (this.idx + 1 < SLIDES.length) this.loadSlideImage(this.idx + 1);
    stopAudio();
    preloadAudioAround(this.idx);
    setTimeout(() => playAudio(SLIDES[this.idx].mp3), 200);
  }

  private pressFx(btn: HTMLElement, e?: MouseEvent) {
    const ripple = document.createElement('span');
    ripple.className = 'press-ripple';
    if (e) {
      const r = btn.getBoundingClientRect();
      ripple.style.left = (e.clientX - r.left) + 'px';
      ripple.style.top = (e.clientY - r.top) + 'px';
    } else { ripple.style.left = '50%'; ripple.style.top = '50%'; }
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
    if (this.idx < SLIDES.length - 1) { this.idx++; this.pushFx(1); 
this.update(); }
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
