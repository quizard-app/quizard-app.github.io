import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { getDoc, getWeakTerms } from '../../core/engine/storage.js';
import { hasApiKey, hasRelay } from '../../core/engine/gemini.js';
import { icon } from '../../shared/icons.js';
import { typeLabel } from '../../shared/helpers.js';
import type { SafeHtml } from '@angular/platform-browser';
import { TYPE_META, estimateAvailable } from '../../core/engine/quizgen.js';
import { detectTopics } from '../../core/engine/topics.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { ToastService } from '../../core/services/toast.service';

const ALL_TYPES = ['mcq', 'tf', 'fib', 'id', 'matching', 'ordering', 'short', 'except', 'multi'];

function typeGlyph(t: string) {
  return { mcq: 'listChecks', tf: 'check', fib: 'fileText', id: 'target', matching: 'gitCompare', ordering: 'listOrdered', short: 'edit', except: 'x', multi: 'plus' }[t] || 'fileText';
}
function typeSub(t: string) {
  return {
    mcq: 'Pick from 4 choices', tf: 'Judge the statement', fib: 'Complete the sentence',
    id: 'Name the missing term', matching: 'Match terms to definitions', ordering: 'Put steps in order',
    short: 'Write a short answer', except: 'Spot the one false statement', multi: 'Pick the two correct statements'
  }[t] || '';
}
function typeTip(t: string) {
  return {
    mcq: 'Choose the correct answer from 4 options', tf: 'Decide if the statement is true or false',
    fib: 'Fill the blank — complete the sentence', id: 'Type the term that matches the description',
    matching: 'Pair each term with the sentence that defines it', ordering: 'Arrange the shuffled steps into the correct sequence',
    short: 'Type a short phrase — graded automatically', except: 'Exam style: three statements are true, one is not',
    multi: 'Exam style: two statements are correct — select both'
  }[t] || '';
}
function typeLabelFor(t: string) { return (TYPE_META as Record<string, any>)[t]?.name || t; }

@Component({
  selector: 'app-setup',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './setup.html',
})
export class SetupPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  ui = inject(UiStateService);
  private quizState = inject(QuizStateService);
  private toast = inject(ToastService);

  doc = signal<any>(null);
  typeLabel = typeLabel;
  count = 10;
  mix: Record<string, boolean> = {};
  difficulty: string = 'medium';
  shuffleOn = false;
  timerSec = 0;
  fresh = true;
  aiOn = true;
  aiAuthor = false;
  focusWeak = false;
  deepVisual = true;
  detectedTopics: any[] = [];
  selectedTopics = new Set<string>();
  maxAvailable = 200;
  starting = false;
  aiReady = false;

  readonly types = ALL_TYPES;
  readonly tileMetas: Record<string, { name: string; sub: string; tip: string; glyph: string; html?: SafeHtml }> = {};
  readonly difficulties = [
    { id: 'easy', label: 'Easy', tip: 'Common, frequently-appearing terms' },
    { id: 'medium', label: 'Medium', tip: 'Balanced mix of terms' },
    { id: 'hard', label: 'Hard', tip: 'Rare, specific technical terms' },
    { id: 'adaptive', label: 'Adaptive', tip: 'Rises to rarer terms on a streak, eases off after a miss' }
  ];
  readonly timers = [0, 15, 30];

  constructor() {
    for (const t of ALL_TYPES) {
      this.tileMetas[t] = { name: typeLabelFor(t), sub: typeSub(t), tip: typeTip(t), glyph: typeGlyph(t) };
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const doc = await getDoc(id);
    if (!doc) { this.router.navigateByUrl('/tabs/library'); return; }
    this.doc.set(doc);
    this.aiReady = hasApiKey() || hasRelay();

    const saved = this.loadConfig(doc.id);
    this.count = saved.count;
    this.mix = { ...saved.mix };
    this.difficulty = saved.difficulty;
    this.shuffleOn = saved.shuffle;
    this.timerSec = saved.timerSec;
    this.fresh = saved.fresh;
    this.aiOn = saved.ai;
    this.aiAuthor = saved.aiAuthor;
    this.focusWeak = saved.focusWeak;
    this.deepVisual = saved.deepVisual;
    this.detectedTopics = Array.isArray(doc.topics) && doc.topics.length ? doc.topics : detectTopics(doc.text).topics;
    this.selectedTopics = new Set(saved.topics || []);
    this.maxAvailable = estimateAvailable(doc as any, { ...saved, topics: [...this.selectedTopics] 
    } as any);
    if (this.count > this.maxAvailable) this.count = Math.max(1, this.maxAvailable);
  }

  private defaultConfig() {
    return {
      count: 10,
      mix: { mcq: true, tf: true, fib: true, id: true, matching: false, ordering: false, short: false, except: false, multi: false },
      difficulty: 'medium', shuffle: false, timerSec: 0, fresh: true,
      topics: [] as string[], ai: true, aiAuthor: false, focusWeak: false, deepVisual: true
    };
  }

  private configs: Record<string, any> = {};
  private loadConfig(docId: string) {
    try { this.configs = JSON.parse(localStorage.getItem('quizard-quiz-configs') || '{}'); } catch { this.configs = {}; }
    return { ...this.defaultConfig(), ...(this.configs[docId] || {}) };
  }
  private saveConfig(docId: string, cfg: any) {
    this.configs[docId] = cfg;
    try { localStorage.setItem('quizard-quiz-configs', JSON.stringify(this.configs)); } catch { /* ignore */ }
  }

  get enabledCount() { return this.types.filter(t => this.mix[t]).length; }
  get poolHint() {
    return this.maxAvailable < 5
      ? `This document supports about ${this.maxAvailable} question${this.maxAvailable === 1 ? '' : 's'} with current settings`
      : `Up to ~${this.maxAvailable} questions available from this document`;
  }
  get themeIcon() { return this.ui.theme() === 'dark' ? 'sun' : 'moon'; }

  setCount(n: number) {
    this.count = Math.min(this.maxAvailable || 200, Math.min(200, Math.max(1, n)));
  }
  toggleType(t: string) {
    const onCount = this.types.filter(x => this.mix[x]).length;
    if (this.mix[t] && onCount === 1) return;
    this.mix[t] = !this.mix[t];
    this.refreshEstimate();
  }
  setDifficulty(d: string) { this.difficulty = d; this.refreshEstimate(); }
  setTimer(s: number) { this.timerSec = s; }
  toggleAi() {
    this.aiOn = !this.aiOn;
    if (!this.aiOn) this.aiAuthor = false;
  }
  toggleTopic(t: string) {
    if (this.selectedTopics.has(t)) this.selectedTopics.delete(t);
    else this.selectedTopics.add(t);
    this.refreshEstimate();
  }
  clearTopics() { this.selectedTopics.clear(); this.refreshEstimate(); }

  refreshEstimate() {
    const doc = this.doc();
    if (!doc) return;
    this.maxAvailable = estimateAvailable(doc as any, {
      count: 999, mix: { ...this.mix }, difficulty: this.difficulty, topics: [...this.selectedTopics],
      shuffle: this.shuffleOn, timerSec: this.timerSec, fresh: this.fresh, ai: this.aiOn
    } as any);
    if (this.count > this.maxAvailable) this.count = Math.max(1, this.maxAvailable);
  }

  perTypeLabel(t: string) {
    return this.mix[t] ? `~${Math.max(1, Math.round(this.count / this.enabledCount))} questions` : 'Off';
  }

  async start() {
    if (!this.enabledCount) { this.toast.toast('Select at least one question type', true); return; }
    const doc = this.doc();
    const cfg = {
      count: this.count, mix: { ...this.mix }, difficulty: this.difficulty as any, shuffle: this.shuffleOn,
      timerSec: this.timerSec, fresh: this.fresh, topics: [...this.selectedTopics], ai: this.aiOn,
      aiAuthor: this.aiOn && this.aiAuthor, focusWeak: this.focusWeak, deepVisual: this.deepVisual, fixedSeed: null
    };
    if (this.focusWeak) {
      try { (cfg as any)['weakTerms'] = await getWeakTerms(doc.id); } catch { (cfg as any)['weakTerms'] = []; }
    }
    this.saveConfig(doc.id, cfg);
    this.quizState.currentDocId.set(doc.id);
    this.quizState.sharedQuiz.set(null);
    this.router.navigateByUrl('/quiz');
  }

  async shareQuiz() {
    this.toast.toast('Share link arrives with the results screen port (M3)');
  }

  back() { this.router.navigateByUrl('/tabs/library'); }
}
