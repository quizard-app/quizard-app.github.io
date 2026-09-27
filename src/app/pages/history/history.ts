import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { listAttempts, listDocs, getWeakTerms, listMistakes } from '../../core/engine/storage.js';
import { icon } from '../../shared/icons.js';
import { dayLabel, fmtTime, scorePill } from '../../shared/helpers.js';
import { emptyProgressArt } from '../../shared/art.js';
import { UiStateService } from '../../core/services/ui-state.service';

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
  private router = inject(Router);
  // the charts and icons below are app-generated fixed markup — the sanitizer
  // strips their svg/style attributes, so they pass through trusted
  private sanitizer = inject(DomSanitizer);
  private trust(html: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html); }

  readonly emptyArt = emptyProgressArt;
  attempts = signal<any[]>([]);
  weakTerms = signal<any[]>([]);
  maxWeight = signal(1);
  docStats = signal<any[]>([]);
  groups = signal<{ day: string; items: any[] }[]>([]);
  trendHtml = signal<SafeHtml | string>('');
  heatmapHtml = signal<SafeHtml | string>('');
  streak = signal(0);
  accuracy = signal<number | null>(null);
  pillOf = scorePill;
  readonly fmtTime = fmtTime;
  readonly dayLabel = dayLabel;
  readonly Math = Math;

  async ngOnInit() {
    const [attempts, docs, weakTerms, mistakes] = await Promise.all([
      listAttempts(), listDocs(), getWeakTerms(null).catch(() => []), listMistakes().catch(() => [])
    ]);
    this.attempts.set(attempts);
    this.weakTerms.set(weakTerms);
    this.maxWeight.set(Math.max(1, ...weakTerms.map((w: any) => w.weight || 0)));

    // headline totals
    this.streak.set(calcStreak(attempts));
    const totalQ = attempts.reduce((s: number, a: any) => s + a.total, 0);
    const totalC = attempts.reduce((s: number, a: any) => s + a.correct, 0);
    this.accuracy.set(totalQ ? Math.round((totalC / totalQ) * 100) : null);
    this.trendHtml.set(this.trust(this.trendChart(attempts)));
    this.heatmapHtml.set(this.trust(this.heatmap(attempts)));

    // per-document rollup: rounds, average, best, last played, banked misses
    const missesByDoc = new Map<string, number>();
    for (const m of mistakes as any[]) missesByDoc.set(m.docId, (missesByDoc.get(m.docId) || 0) + 1);
    const byDoc = new Map<string, any>();
    for (const a of attempts as any[]) {
      const k = a.docId || a.docName || 'other';
      const cur = byDoc.get(k) || { key: k, name: a.docName || 'Practice round', rounds: 0, sum: 0, best: 0, last: 0, questions: 0 };
      cur.rounds++; cur.sum += a.percent; cur.best = Math.max(cur.best, a.percent);
      cur.last = Math.max(cur.last, a.date); cur.questions += a.total;
      byDoc.set(k, cur);
    }
    this.docStats.set([...byDoc.values()]
      .map((d: any) => ({ ...d, avg: Math.round(d.sum / d.rounds), misses: missesByDoc.get(d.key) || 0 }))
      .sort((a: any, b: any) => b.last - a.last).slice(0, 8));

    const map = new Map<string, any[]>();
    for (const a of attempts.slice(0, 40) as any[]) {
      const key = dayLabel(a.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    this.groups.set([...map.entries()].map(([day, items]) => ({ day, items })));
  }

  // 10-week study calendar: one column per week, one cell per day — the
  // intensity shows how many rounds happened that day.
  private heatmap(attempts: any[]) {
    const perDay = new Map<string, number>();
    for (const a of attempts as any[]) {
      const d = new Date(a.date);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      perDay.set(k, (perDay.get(k) || 0) + 1);
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cells: string[] = [];
    for (let i = 69; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 864e5);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const n = perDay.get(k) || 0;
      const col = (69 - i) % 10, row = Math.floor((69 - i) / 10);
      // GitHub-style: a day shades fully once at least one quiz happens on it
      const style = n === 0 ? 'background:var(--surface-3)' : 'background:var(--good)';
      cells.push(`<div class="heat-cell" style="${style};animation-delay:${(col + row) * 16}ms" title="${n} round${n === 1 ? '' : 's'}"></div>`);
    }
    return `
      <div class="chart-wrap">
        <div class="chart-head">
          <span class="section-title" style="margin:0">Study activity</span>
          <span class="faint" style="font-size:11px">last 10 weeks</span>
        </div>
        <div class="heat-grid">${cells.join('')}</div>
        <div class="chart-x"><span>10 weeks ago</span><span>today</span></div>
      </div>`;
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
  openDoc(docId: string) { if (docId) this.router.navigate(['/doc', docId]); }
  hiIcon(a: any): SafeHtml { return this.trust(icon(a.percent >= 50 ? 'trophy' : 'flame')); }
  iconFor(name: string) { return icon(name); }
}
