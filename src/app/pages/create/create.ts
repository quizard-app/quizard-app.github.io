import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { extractText } from '../../core/engine/extract/index.js';
import { parseKeyText } from '../../core/engine/answerkey.js';
import { generateTeacherQuiz, clampCount, MAX_ITEMS } from '../../core/engine/teacher-quiz.js';
import { listKeys, saveQuiz, getQuiz, type TeacherQuiz } from '../../core/engine/storage.js';
import { buildTeacherQuizPdf, buildBubbleSheetsPdf } from '../../core/engine/export.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ByokService } from '../../core/services/byok.service';

const MODES = [
  { id: 'ai', label: 'Full AI', hint: 'AI writes everything from your file' },
  { id: 'key', label: 'Anchor to my key', hint: 'Your key fixes the correct answers' },
  { id: 'format', label: 'Match my format', hint: 'AI copies the style of your example questions' },
];

@Component({
  selector: 'app-create',
  imports: [IonContent, IcoPipe],
  templateUrl: './create.html',
})
export class CreatePage {
  router = inject(Router);
  ui = inject(UiStateService);
  readonly byok = inject(ByokService);
  private toast = inject(ToastService);

  readonly modes = MODES;
  readonly maxItems = MAX_ITEMS;

  stage = signal<'setup' | 'review'>('setup');
  mode = signal<'ai' | 'key' | 'format'>('ai');
  subject = signal('');
  title = signal('');
  count = signal(20);
  fileText = signal('');
  fileName = signal('');
  lessonPaste = signal('');
  keyPaste = signal('');
  pickedKeyId = signal<string | null>(null);
  savedKeys = signal<any[]>([]);
  generating = signal(false);
  error = signal('');

  items = signal<any[]>([]);
  quizId = signal<string | null>(null);
  copies = signal(1);

  readonly keyPreview = computed(() => this.keyPaste().trim() ? parseKeyText(this.keyPaste()) : null);
  readonly keyStats = computed(() => {
    const p = this.keyPreview();
    if (!p?.items?.length) return null;
    return {
      count: p.items.length,
      format: p.format as string,
      notes: p.notes.length,
      complete: p.items.filter((i: any) => i.answerIndex >= 0).length,
    };
  });
  readonly lessonText = computed(() => this.fileText() || this.lessonPaste().trim());
  readonly pickedKey = computed(() => this.savedKeys().find(k => k.id === this.pickedKeyId()) || null);
  readonly keySource = computed(() => this.pickedKey() ?? (this.keyPaste().trim() ? this.keyPreview() : null));
  readonly mcqExamples = computed(() => {
    const src: any = this.keySource();
    return src?.format === 'mcq' ? src.items : [];
  });
  readonly canGenerate = computed(() => {
    if (this.generating()) return false;
    if (!this.subject().trim()) return false;
    if (this.mode() !== 'key' && !this.lessonText()) return false;
    if (this.mode() === 'key') return !!this.keySource() && !!this.keySource().items.length;
    if (this.mode() === 'format') return this.mcqExamples().length > 0;
    return true;
  });
  readonly itemsValid = computed(() => this.items().length && this.items().every(it =>
    it.question.trim() && it.options.every((o: string) => o.trim()) && it.answerIndex >= 0));

  async ionViewWillEnter() {
    if (this.stage() === 'setup') this.savedKeys.set(await listKeys());
  }

  setMode(id: any) { this.mode.set(id); }
  setCount(v: any) { this.count.set(clampCount(v)); }

  async onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.extracting.set(true);
    try {
      const { text } = await extractText(file);
      this.fileText.set(text);
      this.fileName.set(file.name);
      this.toast.toast(`${file.name} ready — ${Math.round(text.length / 100) / 10}k characters extracted`);
    } catch (e: any) {
      this.toast.toast(e?.message || 'Could not read that file', true);
    }
    this.extracting.set(false);
    input.value = '';
  }
  extracting = signal(false);

  clearFile() { this.fileText.set(''); this.fileName.set(''); }

  async generate() {
    if (!this.canGenerate()) return;
    this.generating.set(true);
    this.error.set('');
    try {
      const mode = this.mode();
      let keyItems: any[] = [];
      let examples: any[] = [];
      if (mode === 'key') keyItems = this.keySource()?.items || [];
      if (mode === 'format') {
        examples = this.mcqExamples();
        keyItems = examples; // entries with options are used verbatim too
      }
      const items = await generateTeacherQuiz({
        mode, text: this.lessonText(), keyItems, examples,
        count: mode === 'key' && !this.lessonText()
          ? Math.min(this.count(), keyItems.length || this.count())
          : this.count(),
        subject: this.subject().trim(),
      });
      this.items.set(items.map((it: any, i: number) => ({ ...it, n: i + 1 })));
      this.stage.set('review');
    } catch (e: any) {
      this.error.set(e?.message || 'Generation failed. Check your connection or AI key and try again.');
    }
    this.generating.set(false);
  }

  editQ(i: number, v: string) {
    const next = [...this.items()];
    next[i] = { ...next[i], question: v };
    this.items.set(next);
  }
  setOpt(i: number, oi: number, v: string) {
    const next = [...this.items()];
    const options = [...next[i].options];
    options[oi] = v;
    next[i] = { ...next[i], options };
    this.items.set(next);
  }
  setAnswer(i: number, oi: number) {
    const next = [...this.items()];
    next[i] = { ...next[i], answerIndex: oi };
    this.items.set(next);
  }
  removeItem(i: number) {
    const next = this.items().filter((_, k) => k !== i).map((it, k) => ({ ...it, n: k + 1 }));
    this.items.set(next);
  }
  addItem() {
    this.items.set([...this.items(), { n: this.items().length + 1, question: '', options: ['', '', '', ''], answerIndex: 0 }]);
  }

  async save() {
    if (!this.itemsValid()) return;
    const quiz = await saveQuiz({
      subject: this.subject().trim(),
      title: this.title().trim(),
      source: this.mode(),
      items: this.items(),
    });
    this.quizId.set(quiz.id);
    this.toast.toast('Quiz saved ✓ — printable copies are ready below');
  }

  // ── preview → download flow ──
  previewOpen = signal(false);
  previewBusy = signal(false);
  previewPages = signal(1);
  previewLabel = signal('');
  previewDoc: any = null;
  previewFilename = '';

  async printQuiz() { await this.previewWith(getQuiz, 'quiz'); }
  async printKey() { await this.previewWith(getQuiz, 'key'); }
  async printSheets() { await this.previewWith(getQuiz, 'sheets'); }

  private async previewWith(getter: (id: string) => Promise<TeacherQuiz | null>, kind: 'quiz' | 'key' | 'sheets') {
    const id = this.quizId();
    if (!id) return;
    const quiz = await getter(id);
    if (!quiz) return;
    this.previewBusy.set(true);
    try {
      if (kind === 'quiz') {
        this.previewDoc = await buildTeacherQuizPdf(quiz);
        this.previewFilename = `quizard-quiz-${slugify(quiz.subject || quiz.title)}`;
        this.previewLabel.set('Student quiz paper');
      } else if (kind === 'key') {
        this.previewDoc = await buildTeacherQuizPdf(quiz, { withAnswers: true });
        this.previewFilename = `quizard-key-${slugify(quiz.subject || quiz.title)}`;
        this.previewLabel.set('Teacher’s answer key');
      } else {
        this.previewDoc = await buildBubbleSheetsPdf(quiz, this.copies(), this.paper());
        this.previewFilename = `quizard-bubble-sheets-${slugify(quiz.subject || quiz.title)}`;
        this.previewLabel.set(`Bubble answer sheets (${this.paper()})`);
      }
      this.previewOpen.set(true);
      this.previewBusy.set(false); // the canvas mounts in the non-busy branch
      await this.renderPreview();
    } catch (e: any) {
      this.toast.toast(e?.message || 'Could not build the PDF', true);
      this.previewBusy.set(false);
    }
  }

  private async renderPreview() {
    // wait for the modal's canvas to mount (zoneless re-render)
    let canvas: HTMLCanvasElement | null = null;
    for (let i = 0; i < 25 && !canvas; i++) {
      canvas = document.querySelector('canvas.preview-canvas') as HTMLCanvasElement | null;
      if (!canvas) await new Promise(r => setTimeout(r, 80));
    }
    if (!canvas || !this.previewDoc) return;
    try {
      const pdfjs: any = await import('pdfjs-dist');
      // same worker setup as the import pipeline: absolute URL so both the
      // real worker and the fake-worker fallback resolve, and the service
      // worker can serve the precached file offline
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', document.baseURI).href;
      const buf = this.previewDoc.output('arraybuffer');
      const pdf = await pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise;
      this.previewPages.set(pdf.numPages);
      const pdfPage = await pdf.getPage(1);
      const scale = 340 / pdfPage.getViewport({ scale: 1 }).width;
      const vp = pdfPage.getViewport({ scale });
      canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
      await pdfPage.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
    } catch (e: any) {
      this.toast.toast('Preview failed — you can still download the PDF', true);
    }
  }

  downloadPreview() {
    if (this.previewDoc) this.previewDoc.save(`${this.previewFilename}.pdf`);
    this.toast.toast('PDF downloaded ✓');
  }

  closePreview() {
    this.previewOpen.set(false);
    this.previewDoc = null;
  }

  paper = signal<'letter' | 'a4' | 'long'>('letter');
  setPaper(p: any) { this.paper.set(p); }

  backToSetup() {
    this.stage.set('setup');
    this.items.set([]);
    this.quizId.set(null);
    this.savedKeys.set([]);
    void this.ionViewWillEnter();
  }
}

function slugify(v: any) {
  return String(v || 'doc').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'doc'
}
