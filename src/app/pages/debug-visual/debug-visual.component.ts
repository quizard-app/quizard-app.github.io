import { Component, inject, OnInit, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { listDocs, getDoc } from '../../core/engine/storage.js';
import { renderPdfVisuals } from '../../core/engine/extract/renderPage.js';
import { generateQuizAI } from '../../core/engine/quiz-ai.js';

@Component({
  selector: 'app-debug-visual',
  imports: [IonContent],
  template: `<ion-content class="ion-padding"><img [src]="imgUrl()" alt="question visual" style="max-width:100%;border-radius:12px" /><pre style="font-size:11px;white-space:pre-wrap;color:var(--text)">{{ log() }}</pre></ion-content>`,
})
export class DebugVisualPage implements OnInit {
  log = signal('starting…\n');
  imgUrl = signal<string | null>(null);
  private append(s: string) { this.log.update(v => v + s + '\n'); }

  async ngOnInit() {
    try {
      const docs = await listDocs();
      this.append('docs: ' + docs.length);
      const meta = docs[0];
      if (!meta) { this.append('no docs — import a PDF first'); return; }
      const doc: any = await getDoc(meta.id);
      this.append('doc: ' + doc.name + ' | type: ' + doc.type + ' | words: ' + doc.wordCount);
      this.append('original present: ' + (doc.original instanceof Blob) + ' size: ' + (doc.original?.size || 0));

      const rendered = await renderPdfVisuals(doc.original, { maxPages: 8 });
      this.append('renderPdfVisuals pages: ' + rendered.length + (rendered[0] ? ' | first: ' + rendered[0].mime + ' ' + rendered[0].blob.size + 'B' : ''));

      this.append('running generateQuizAI (count 25, deepVisual on)…');
      const t0 = Date.now();
      const gen: any = await generateQuizAI(doc, { count: 25, mix: { mcq: true, tf: true, fib: true, id: true }, difficulty: 'medium', ai: true, aiAuthor: false, deepVisual: true, shuffle: false, fresh: true, topics: [] });
      this.append('generateQuizAI took ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
      this.append('total questions: ' + gen.questions.length + ' | aiPolished: ' + gen.aiPolished + ' | aiNote: ' + (gen.aiNote || 'none'));
      const withImg = gen.questions.filter((q: any) => q.imageId);
      this.append('questions WITH image: ' + withImg.length);
      for (const q of withImg.slice(0, 3)) {
        this.append('  • [' + q.type + '] ' + (q.stem || q.prompt || '').slice(0, 90) + ' | imageId: ' + q.imageId);
      }
      this.append('DONE');
      const first = withImg[0];
      if (first?.imageId) {
        const { getImageById } = await import('../../core/engine/storage.js');
        const rec = await getImageById(first.imageId);
        if (rec?.blob) this.imgUrl.set(URL.createObjectURL(rec.blob));
      }
    } catch (e: any) {
      this.append('ERROR: ' + (e?.message || e));
      this.append(e?.stack?.slice(0, 400) || '');
    }
  }
}
