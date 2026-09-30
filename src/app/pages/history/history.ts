import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { listAttempts, listDocs, getWeakTerms, listMistakes } from '../../core/engine/storage.js';
import { icon } from '../../shared/icons.js';
import { dayLabel, fmtTime, scorePill, mergeActivity } from '../../shared/helpers.js';
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
  private allAttempts: any[] = [];
  private trust(html: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html); }

  readonly emptyArt = emptyProgressArt;
  attempts = signal<any[]>([]);
  weakTerms = signal<any[]>([]);
  maxWeight = signal(1);
  docStats = signal<any[]>([]);
  activity = signal<any[]>([]);
  trendHtml = signal<SafeHtml | string>('');
  heatmapHtml = signal<SafeHtml | string>('');
  nextAction = signal<{ docId: string; icon: string; title: string; sub: string } | null>(null);
  weekCompare = signal<{ cur: number; prev: number; up: boolean } | null>(null);
  selectedYear = signal(new Date().getFullYear());
  years = signal<number[]>([]);
  yearCount = signal(0);
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
    this.allAttempts = attempts as any[];
    this.weakTerms.set(weakTerms);
    this.maxWeight.set(Math.max(1, ...weakTerms.map((w: any) => w.weight || 0)));

    // headline totals
    this.streak.set(calcStreak(attempts));
    const totalQ = attempts.reduce((s: number, a: any) => s + a.total, 0);
    const totalC = attempts.reduce((s: number, a: any) => s + a.correct, 0);
    this.accuracy.set(totalQ ? Math.round((totalC / totalQ) * 100) : null);
    this.trendHtml.set(this.trust(this.trendChart(attempts)));
    // GitHub-style year grid: default to the current year, offer every year
    // with activity in the dropdown
    this.selectedYear.set(new Date().getFullYear());
    const ys = [...new Set((attempts as any[]).map(a => new Date(a.date).getFullYear()))];
    this.years.set(ys.sort((a, b) => b - a));
    this.heatmapHtml.set(this.trust(this.heatmap(this.allAttempts, this.selectedYear())));

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

    // week-over-week accuracy direction
    const weekAgo = Date.now() - 7 * 864e5;
    const twoWeeks = Date.now() - 14 * 864e5;
    const cur = (attempts as any[]).filter(a => a.date >= weekAgo);
    const prev = (attempts as any[]).filter(a => a.date >= twoWeeks && a.date < weekAgo);
    if (cur.length && prev.length) {
      const cq = cur.reduce((s, a) => s + a.total, 0), cc = cur.reduce((s, a) => s + a.correct, 0);
      const pq = prev.reduce((s, a) => s + a.total, 0), pc = prev.reduce((s, a) => s + a.correct, 0);
      if (cq && pq) {
        const ca = Math.round(cc / cq * 100), pa = Math.round(pc / pq * 100);
        this.weekCompare.set({ cur: ca, prev: pa, up: ca >= pa });
      }
    }

    // "What to do next": the weakest document first, then untried ones
    const docsList = docs as any[];
    const quizzed = docsList
      .filter(d => byDoc.has(d.id))
      .map(d => ({ doc: d, stat: byDoc.get(d.id) }))
      .sort((a, b) => a.stat.avg - b.stat.avg);
    let next: { docId: string; icon: string; title: string; sub: string } | null = null;
    if (quizzed.length && quizzed[0].stat.avg < 90) {
      const w = quizzed[0];
      next = {
        docId: w.doc.id, icon: 'refresh', title: `Re-quiz "${w.doc.name}"`,
        sub: `You're at ${w.stat.avg}%${w.stat.misses ? ` — ${w.stat.misses} wrong answer${w.stat.misses === 1 ? '' : 's'} saved` : ''}.`
      };
    } else {
      const untried = docsList.find(d => !byDoc.has(d.id));
      if (untried) {
        next = { docId: untried.id, icon: 'play', title: `Try "${untried.name}"`, sub: 'You haven\u2019t quizzed this document yet.' };
      } else if (quizzed.length) {
        next = { docId: quizzed[0].doc.id, icon: 'check', title: 'All caught up', sub: 'Every document is at 90% or higher. Keep the streak alive.' };
      }
    }
    this.nextAction.set(next);

    this.activity.set(mergeActivity(attempts, 12));
  }

  // 10-week study calendar: one column per week, one cell per day — the
  // intensity shows how many rounds happened that day.
  // GitHub-style year grid: one column per week (Sun–Sat rows), month labels
  // on top, every day of the selected year — a cell shades fully once at
  // least one quiz happens on it. Future days stay blank.
  setYear(v: string | number) {
    const y = Number(v);
    if (!y) return;
    this.selectedYear.set(y);
    this.heatmapHtml.set(this.trust(this.heatmap(this.allAttempts, y)));
  }

  private heatmap(attempts: any[], year: number) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const perDay = new Map<string, number>();
    let yearTotal = 0;
    for (const a of attempts) {
      const d = new Date(a.date);
      if (d.getFullYear() !== year) continue;
      yearTotal++;
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      perDay.set(k, (perDay.get(k) || 0) + 1);
    }
    this.yearCount.set(yearTotal);

    // columns run Sunday-aligned from the week containing Jan 1 to Dec 31
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const start = new Date(jan1);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(dec31);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const weeks = Math.round((+end - +start) / 864e5 / 7);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const cells: string[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(start.getTime() + (w * 7 + day) * 864e5);
        const inYear = d.getFullYear() === year;
        const future = d > today;
        const n = perDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) || 0;
        const cls = !inYear || future ? 'future' : n > 0 ? 'on' : '';
        const label = inYear ? `${n} quiz${n === 1 ? '' : 's'} · ${monthNames[d.getMonth()]} ${d.getDate()}` : '';
        cells.push(`<span class="heat-cell ${cls}" title="${label}"></span>`);
      }
    }

    const labels: string[] = [];
    let lastCol = -3;
    for (let m = 0; m < 12; m++) {
      const col = Math.floor((+(new Date(year, m, 1)) - +start) / 864e5 / 7);
      if (col < 0 || col > weeks - 3 || col - lastCol < 3) continue;
      labels.push(`<span style="grid-column:${col + 1}">${monthNames[m]}</span>`);
      lastCol = col;
    }

    return `
      <div class="gh-wrap">
        <div class="gh-days"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>
        <div class="gh-scroll">
          <div class="gh-main">
            <div class="gh-months" style="grid-template-columns:repeat(${weeks},11px)">${labels.join('')}</div>
            <div class="gh-grid">${cells.join('')}</div>
          </div>
        </div>
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
