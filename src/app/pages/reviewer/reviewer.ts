import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { getDoc, loadSettings, saveSettings, upsertSrsFromMistake } from '../../core/engine/storage.js';
import { detectTopics } from '../../core/engine/topics.js';
import { sentences } from '../../core/engine/textproc.js';
import { summarizeDoc } from '../../core/engine/summarize.js';
import { ensureAIReviewer, reviewerToHtml } from '../../core/engine/reviewer-ai.js';
import { generateQuiz, MCQ_ONLY_MIX } from '../../core/engine/quizgen.js';
import { icon } from '../../shared/icons.js';
import { typeLabel } from '../../shared/helpers.js';
import { exportSummary, printStudySheet, exportPdfHandout } from '../../core/engine/export.js';
import { assetUrl } from '../../shared/assets.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { ByokService } from '../../core/services/byok.service';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

function chunkParas(sentenceList: string[], size = 3) {
  const out: string[][] = [];
  for (let i = 0; i < sentenceList.length; i += size) out.push(sentenceList.slice(i, i + size));
  return out.map(g => g.join(' '));
}

const STOP = /^(The|This|That|These|Those|It|Its|In|At|On|And|But|For|With|When|After|Today|Just|Only|Most|Many|Both|Each|Such|Then|They|There)$/;

@Component({
  selector: 'app-reviewer',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './reviewer.html',
})
export class ReviewerPage implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  ui = inject(UiStateService);
  typeLabel = typeLabel;
  private qs = inject(QuizStateService);
  readonly byok = inject(ByokService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('content') content?: ElementRef<HTMLElement>;

  doc = signal<any>(null);
  contentHtml = signal<SafeHtml | string>('');
  scale = 1;
  // AI reviewer (reviewer-ai.js): forged from the uploaded file, cached on the doc
  aiReviewer = signal<any>(null);
  aiState = signal<'idle' | 'generating' | 'ready' | 'error'>('idle');
  aiMode = signal(true);
  private aiTried = false;
  findVisible = signal(false);
  findCount = signal('');

  private nlp: any = null;
  private nlpBuilding = false;
  private findMatches: HTMLElement[] = [];
  private findPos = -1;
  private zoom: any = null;

  get themeIcon() { return this.ui.theme() === 'dark' ? 'sun' : 'moon'; }

  private ico(name: string): string { return icon(name); }
  private esc(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async load() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const doc = await getDoc(id);
    if (!doc) { this.router.navigateByUrl('/tabs/library'); return; }
    this.doc.set(doc);
    if ((doc.reviewerAI as any)?.parts?.length) {
      this.aiReviewer.set(doc.reviewerAI);
      this.aiState.set('ready');
    }
    const settings = loadSettings();
    this.scale = settings.readerScale || 1;
    this.aiMode.set(settings.reviewerAiMode !== false);
    // the article element renders one CD tick after the doc signal — defer
    setTimeout(() => this.applyView(), 0);
    void this.tryGenerateAi();
  }

  ngAfterViewInit() {
    this.load();
  }

  private buildNlp() {
    const doc = this.doc();
    const sents = sentences(doc.text);
    const t = detectTopics(doc.text);
    const topics = t.topics;
    const membership = t.membership;
    const summary = summarizeDoc(doc.text);
    const sections: any[] = [];
    if (topics.length && sents.length) {
      const buckets = new Map(topics.map((tp: any) => [tp.title, [] as any[]]));
      const general: string[] = [];
      for (const s of sents) {
        const tt = membership.get(s);
        if (tt && buckets.has(tt)) buckets.get(tt)!.push(s);
        else general.push(s);
      }
      if (general.length >= 2) sections.push({ title: 'Overview', paras: chunkParas(general) });
      for (const tp of topics) {
        const ss = buckets.get(tp.title);
        if (ss?.length) sections.push({ title: tp.title, paras: chunkParas(ss) });
      }
    } else {
      sections.push({ title: null, paras: chunkParas(sents.length ? sents : doc.text.split(/(?<=[.!?])\s+/)) });
    }
    const keyTermDefs: any[] = [];
    const seenTerms = new Set();
    for (const sec of summary.sections) {
      for (const term of sec.terms) {
        const key = term.toLowerCase();
        if (seenTerms.has(key) || keyTermDefs.length >= 8) continue;
        seenTerms.add(key);
        const def = sents.find((st: string) => st.toLowerCase().includes(key) && st.length > 20);
        if (def) keyTermDefs.push({ term, def });
      }
    }
    const q = generateQuiz(doc, { count: 6, mix: { ...MCQ_ONLY_MIX }, difficulty: 'medium', shuffle: false, fixedSeed: 7 });
    const reviewQs = (q.questions || []).filter((x: any) => x.type !== 'short');
    this.nlp = {
      sents, topics, summary, sections, keyTermDefs, reviewQs,
      readTargets: {
        summary: summary.sections.flatMap((s: any) => s.points),
        full: sections.flatMap((s: any) => s.paras)
      }
    };
  }

  private summaryHtml(): string {
    const doc = this.doc();
    const { summary, sections, keyTermDefs, reviewQs } = this.nlp;
    if (!summary.tldr.length) {
      return `<div class="empty-state"><h3>Not enough to summarize</h3><p>This document has too little readable text. Try the Full text tab.</p></div>`;
    }
    const parts: string[] = [];
    parts.push(`
      <div class="rvw-head">
        <div class="rvw-eyebrow">${this.ico('book')} Study Reviewer</div>
        <h1 class="rvw-title">${this.esc(doc.name)}</h1>
        <div class="rvw-meta">${typeLabel(doc.type)} · ${doc.wordCount.toLocaleString()} words · ${sections.length} section${sections.length === 1 ? '' : 's'} · ${keyTermDefs.length} key term${keyTermDefs.length === 1 ? '' : 's'}</div>
      </div>`);
    if (summary.tldr.length) {
      parts.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">I</span><h3>Overview</h3></div>
          ${summary.tldr.map((p: string) => `<p class="rvw-overview" data-point>${this.esc(p)}</p>`).join('')}
        </div>`);
    }
    if (keyTermDefs.length) {
      parts.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">II</span><h3>Key Terms &amp; Definitions</h3></div>
          <dl class="rvw-terms">
            ${keyTermDefs.map((t: any) => `<div class="rvw-term"><dt>${this.esc(t.term)}</dt><dd>${this.esc(t.def)}</dd></div>`).join('')}
          </dl>
        </div>`);
    }
    if (summary.sections.length) {
      parts.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">III</span><h3>Section Notes</h3></div>
          ${summary.sections.map((sec: any, i: number) => `
            <div class="sum-section">
              <div class="sum-head">
                <span class="sum-num">${String(i + 1).padStart(2, '0')}</span>
                <h4>${this.esc(sec.title)}</h4>
                <span class="chip-count">${sec.sentenceCount} sentence${sec.sentenceCount === 1 ? '' : 's'}</span>
              </div>
              <ul class="sum-points">
                ${sec.points.map((p: string) => `<li>${this.esc(p)}</li>`).join('')}
              </ul>
            </div>`).join('')}
        </div>`);
    }
    if (reviewQs.length) {
      parts.push(`
        <div class="rvw-part">
          <div class="rvw-part-head"><span class="rvw-num">IV</span><h3>Test Yourself</h3></div>
          <ol class="rvq-list">
            ${reviewQs.map((q: any) => this.selfTestItemHtml(q)).join('')}
          </ol>
        </div>`);
    }
    return parts.join('') + `<p class="sum-note">Forged from your document — open <strong>Full text</strong> to read everything.</p>`;
  }

  private selfTestItemHtml(q: any): string {
    const TYPE_LABEL: Record<string, string> = { tf: 'TRUE or FALSE', matching: 'MATCHING', ordering: 'ORDERING' };
    let qText = '', optsHtml = '', ansHtml = '';
    const optList = (arr: string[], numbered = false) =>
      `<div class="rvq-opts">${(arr || []).map((o, oi) =>
        `<span>${numbered ? oi + 1 + '.' : String.fromCharCode(65 + oi) + '.'} ${this.esc(o)}</span>`).join('')}</div>`;
    if (q.type === 'mcq' || q.type === 'except') {
      qText = (q.type === 'except' ? '<span class="rvq-tag">EXCEPT</span> ' : '') + this.esc(q.stem);
      optsHtml = optList(q.options);
      ansHtml = q.options?.[q.answerIndex] ?? '';
    } else if (q.type === 'multi') {
      qText = '<span class="rvq-tag">SELECT 2</span> ' + this.esc(q.stem);
      optsHtml = optList(q.options);
      ansHtml = (q.answerIndices || []).map((i: number) => q.options?.[i]).filter(Boolean).join(' · ');
    } else if (q.type === 'tf') {
      qText = `<span class="rvq-tag">T/F</span> ${this.esc(q.statement)}`;
      ansHtml = q.answer ? 'True' : 'False';
    } else if (q.type === 'fib') {
      qText = this.esc(q.stem);
      optsHtml = optList(q.choices, true);
      ansHtml = q.choices?.[q.answerIndex] ?? '';
    } else if (q.type === 'id') {
      qText = `Identify the term: ${this.esc(q.clue)}`;
      ansHtml = q.answer ?? '';
    } else if (q.type === 'matching') {
      qText = `${this.esc(q.prompt)}`;
      optsHtml = `
        <div class="rvq-opts rvq-match">
          <div class="rvq-match-col"><b>Terms</b>${(q.pairs || []).map((p: any) => `<span>${this.esc(p.left)}</span>`).join('')}</div>
          <div class="rvq-match-col"><b>Definitions</b>${(q.rightOrder || []).map((pi: number) => `<span>${this.esc(q.pairs?.[pi]?.right || '')}</span>`).join('')}</div>
        </div>`;
      ansHtml = (q.pairs || []).map((p: any) => `${p.left} → ${p.right}`).join(' · ');
    } else if (q.type === 'ordering') {
      qText = `${this.esc(q.prompt)}`;
      optsHtml = optList(q.shuffled || q.steps, true);
      ansHtml = (q.steps || []).map((s: string, si: number) => `${si + 1}. ${s}`).join('  ·  ');
    } else return '';
    const tag = TYPE_LABEL[q.type] ? `<span class="rvq-tag">${TYPE_LABEL[q.type]}</span> ` : '';
    return `<li class="rvq">
      <div class="rvq-q">${tag}${qText}${optsHtml}</div>
      <details class="rvq-reveal"><summary>Check answer</summary><span>${this.esc(ansHtml)}</span></details>
    </li>`;
  }

  private fullHtml(): string {
    return this.nlp.sections.map((sec: any) => `
      <section class="reader-section">
        ${sec.title ? `<h2>${this.esc(sec.title)}</h2>` : ''}
        ${sec.paras.map((p: string) => `<p data-para>${this.esc(p)}</p>`).join('')}
      </section>`).join('') + '<p class="reader-end">· · ·</p>';
  }

  private trust(html: string) { return this.sanitizer.bypassSecurityTrustHtml(html); }

  // ── AI reviewer: Gemini writes the exam-style reviewer from the uploaded file ──
  private aiReviewHtml(): string {
    return reviewerToHtml(this.aiReviewer(), (s: string) => this.esc(s));
  }

  private async tryGenerateAi() {
    if (this.aiTried || this.aiState() === 'ready') return;
    this.aiTried = true;
    const doc = this.doc();
    if (!doc?.text || String(doc.text).trim().length < 300) return;
    this.aiState.set('generating');
    const res = await ensureAIReviewer(doc);
    if (res.reviewer) {
      this.aiReviewer.set(res.reviewer);
      this.aiState.set('ready');
      this.byok.notifyAiOk();
    } else if (res.error !== 'not_enough_content') {
      this.aiState.set('error');
      this.byok.notifyAiFailure(res.error || 'error');
    } else {
      this.aiState.set('idle');
      return;
    }
    this.applyView();
  }

  retryAi() {
    if (this.aiState() === 'generating') return;
    this.aiTried = false;
    this.aiState.set('idle');
    void this.tryGenerateAi();
  }

  setAiMode(v: boolean) {
    this.aiMode.set(v);
    saveSettings({ reviewerAiMode: v });
    this.applyView();
  }

  private applyView() {
    const content = this.content?.nativeElement;
    if (!content) return;
    const fc = content.closest('.rev-screen')?.querySelector('.font-controls') as HTMLElement | null;
    if (!this.nlp) {
      this.contentHtml.set(this.trust('<div class="reader-loading">Preparing your document…</div>'));
      if (!this.nlpBuilding) {
        this.nlpBuilding = true;
        setTimeout(() => { this.buildNlp(); this.nlpBuilding = false; this.applyView(); }, 0);
      }
      return;
    }
    this.contentHtml.set(this.trust(this.aiMode() && this.aiReviewer() ? this.aiReviewHtml() : this.summaryHtml()));
    content.classList.add('summary-mode');
    if (fc) fc.style.visibility = 'hidden';
    this.clearFind();
  }

  // ── find in document ──
  findQuery = '';
  private clearFind() {
    this.findMatches = [];
    this.findPos = -1;
    this.findCount.set('');
    const content = this.content?.nativeElement;
    content?.querySelectorAll('mark.find-hit, mark.find-current').forEach(m => {
      const parent = m.parentNode!;
      parent.replaceChild(document.createTextNode(m.textContent || ''), m);
      parent.normalize();
    });
  }

  runFind() {
    this.clearFind();
    const q = this.findQuery.trim();
    if (q.length < 2) return;
    const content = this.content!.nativeElement;
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      if (n.nodeValue && n.nodeValue.toLowerCase().includes(q.toLowerCase())) nodes.push(n);
    }
    for (const node of nodes) {
      const text = node.nodeValue || '';
      const frag = document.createDocumentFragment();
      let pos = 0;
      const lower = text.toLowerCase();
      let at = lower.indexOf(q.toLowerCase());
      while (at !== -1) {
        frag.appendChild(document.createTextNode(text.slice(pos, at)));
        const mark = document.createElement('mark');
        mark.className = 'find-hit';
        mark.textContent = text.slice(at, at + q.length);
        frag.appendChild(mark);
        this.findMatches.push(mark);
        pos = at + q.length;
        at = lower.indexOf(q.toLowerCase(), pos);
      }
      frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode!.replaceChild(frag, node);
    }
    this.stepFind(0);
  }

  onFindKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); this.stepFind(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { this.findQuery = ''; this.clearFind(); }
  }

  stepFind(dir: number) {
    if (!this.findMatches.length) { this.findCount.set('0/0'); return; }
    this.findPos = dir === 0 ? 0 : (this.findPos + dir + this.findMatches.length) % this.findMatches.length;
    this.findMatches.forEach((m, i) => m.classList.toggle('find-current', i === this.findPos));
    this.findCount.set(`${this.findPos + 1}/${this.findMatches.length}`);
    this.findMatches[this.findPos]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // ── long-press to bank a line into spaced repetition ──
  private attachSaveOnPress() {
    const content = this.content?.nativeElement;
    if (!content) return;
    content.querySelectorAll('[data-para]').forEach(p => {
      const el = p as HTMLElement;
      let timer: any = null;
      let firedFor: HTMLElement | null = null;
      const start = (e: PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        firedFor = null;
        timer = setTimeout(async () => {
          firedFor = el;
          try {
            const sentence = (el.textContent || '').trim().slice(0, 300);
            const term = this.nlp.keyTermDefs.find((t: any) => sentence.toLowerCase().includes(t.term.toLowerCase()))?.term
              || this.firstKeyPhrase(sentence);
            await upsertSrsFromMistake({ docId: this.doc().id, sentence, term, type: 'note' });
            el.classList.add('saved-flash');
            setTimeout(() => el.classList.remove('saved-flash'), 900);
            this.toast.toast('Saved to your review deck ✦');
          } catch { this.toast.toast('Could not save this line', true); }
        }, 550);
      };
      const cancel = () => { if (firedFor === null) clearTimeout(timer); };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', cancel);
      el.addEventListener('pointerleave', cancel);
      el.addEventListener('pointercancel', cancel);
    });
  }

  private firstKeyPhrase(sentence: string) {
    const words = sentence.split(/\s+/).slice(0, 6);
    for (let i = 0; i < Math.min(3, words.length); i++) {
      const m = words.slice(i).join(' ').match(/^([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|de|van|von|da)?[A-Z][a-zA-Z'’-]+)*)/);
      if (m && m[1].length > 3 && !STOP.test(m[1].split(' ')[0])) return m[1].split(' ').slice(0, 3).join(' ');
    }
    return words.slice(0, 4).join(' ');
  }

  private applyScale() {
    if (this.content) this.content.nativeElement.style.fontSize = (15 * this.scale).toFixed(1) + 'px';
  }
  fontMinus() { this.scale = Math.max(0.85, +(this.scale - 0.1).toFixed(2)); saveSettings({ readerScale: this.scale }); this.applyScale(); }
  fontPlus() { this.scale = Math.min(1.5, +(this.scale + 0.1).toFixed(2)); saveSettings({ readerScale: this.scale }); this.applyScale(); }

  // ── actions ──
  quizMe() {
    this.qs.currentDocId.set(this.doc().id);
    this.router.navigate(['/doc', this.doc().id, 'setup']);
  }
  back() {
    this.router.navigate(['/doc', this.doc().id]);
  }
  exportMd() { exportSummary(this.doc()); this.toast.toast('Downloaded study sheet (.md)'); }
  async exportPdf() {
    try {
      await exportPdfHandout(this.doc(), { keyTermDefs: this.nlp?.keyTermDefs || [], reviewQs: this.nlp?.reviewQs || [] });
      this.toast.toast('PDF handout downloaded ✓');
    } catch { this.toast.toast('Could not build the PDF', true); }
  }
  print() { if (!printStudySheet(this.doc())) this.toast.toast('Allow pop-ups to print'); }
}
