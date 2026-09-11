import { Component, inject, OnInit, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { listAttempts, listDocs, countMistakes, countDueCards, getWeakTerms } from '../../core/engine/storage.js';
import { icon } from '../../shared/icons.js';
import { dayLabel, fmtTime, scorePill } from '../../shared/helpers.js';
import { emptyProgressArt } from '../../shared/art.js';
import { UiStateService } from '../../core/services/ui-state.service';
import { MistakesService } from '../../core/services/mistakes.service';

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function calcStreak(attempts: any[]) {
  if (!attempts.length) return 0;
  const days = new Set(attempts.map(a => dayKey(a.date)));
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  let start: Date | null = null;
  if (days.has(dayKey(today.getTime()))) start = today;
  else if (days.has(dayKey(yesterday.getTime()))) start = yesterday;
  else return 0;
  let streak = 0;
  const cursor = new Date(start);
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

@Component({
  selector: 'app-history',
  imports: [IonContent],
  templateUrl: './history.html',
})
export class HistoryPage implements OnInit {
  ui = inject(UiStateService);
  mistakes = inject(MistakesService);

  readonly emptyArt = emptyProgressArt;
  attempts = signal<any[]>([]);
  docCount = signal(0);
  mistakeCount = signal(0);
  dueCount = signal(0);
  weakTerms = signal<any[]>([]);
  studied = signal<any[]>([]);
  groups = signal<{ day: string; items: any[] }[]>([]);
  trendHtml = signal('');
  streak = signal(0);
  accuracy = signal<number | null>(null);
  pillOf = scorePill;
  readonly fmtTime = fmtTime;
  readonly Math = Math;

  async ngOnInit() {
    const [attempts, docs, mistakeCount, dueCount, weakTerms] = await Promise.all([
      listAttempts(), listDocs(), countMistakes(), countDueCards(), getWeakTerms(null)
    ]);
    this.attempts.set(attempts);
    this.docCount.set(docs.length);
    this.mistakeCount.set(mistakeCount);
    this.dueCount.set(dueCount);
    this.weakTerms.set(weakTerms);
    this.studied.set(docs.filter((d: any) => d.attempts > 0));
    this.streak.set(calcStreak(attempts));
    const totalQ = attempts.reduce((s: number, a: any) => s + a.total, 0);
    const totalC = attempts.reduce((s: number, a: any) => s + a.correct, 0);
    this.accuracy.set(totalQ ? Math.round((totalC / totalQ) * 100) : null);
    this.trendHtml.set(this.trendChart(attempts));

    const map = new Map<string, any[]>();
    for (const a of attempts.slice(0, 40)) {
      const key = dayLabel(a.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    this.groups.set([...map.entries()].map(([day, items]) => ({ day, items })));
  }

  private trendChart(attempts: any[]) {
    const recent = attempts.slice(0, 20).reverse();
    if (!recent.length) return '';
    const W = 320, H = 110, base = 96;
    const n = recent.length;
    const slot = W / n;
    const bw = Math.min(18, slot * 0.62);
    const bars = recent.map((a: any, i: number) => {
      const h = Math.max(4, (a.percent / 100) * 82);
      const x = i * slot + (slot - bw) / 2;
      const y = base - h;
      const cls = a.percent >= 80 ? 'var(--good)' : a.percent >= 50 ? 'var(--warn)' : 'var(--bad)';
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3.5" fill="${cls}" opacity="${i === n - 1 ? 1 : 0.55}"/>`;
    }).join('');
    const lastPct = recent[n - 1].percent;
    return `
      <div class="chart-wrap">
        <div class="chart-head">
          <span class="section-title" style="margin:0">Last ${n} quiz${n > 1 ? 'zes' : ''}</span>
          <span class="score-pill ${scorePill(lastPct)}">${lastPct}% latest</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="trend-svg">
          <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="var(--surface-3)" stroke-width="1.5"/>
          ${bars}
        </svg>
        <div class="chart-x"><span>older</span><span>now</span></div>
      </div>`;
  }

  pctColor(pct: number) { return pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--warn)' : 'var(--bad)'; }
  hiIcon(a: any) { return icon(a.percent >= 50 ? 'trophy' : 'flame'); }
  iconFor(name: string) { return icon(name); }
  bestOf(d: any) { return d.bestScore != null ? d.bestScore + '%' : '—'; }
}
