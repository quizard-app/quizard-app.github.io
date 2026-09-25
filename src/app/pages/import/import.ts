import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { extractText, detectType } from '../../core/engine/extract/index.js';
import { extractImages } from '../../core/engine/extract/images.js';
import { saveDoc, saveDocImages, listDocs, deriveFolders } from '../../core/engine/storage.js';
import { detectTopics } from '../../core/engine/topics.js';
import { oneLineSummary } from '../../core/engine/summarize.js';
import { transcribeImage } from '../../core/engine/transcribe.js';
import { hasApiKey } from '../../core/engine/gemini.js';
import { extractUrl, isProbablyArticleUrl, youTubeVideoId, youTubeTitle } from '../../core/engine/web.js';
import { dropzoneArt } from '../../shared/art.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';

type Stage = 'drop' | 'paste' | 'photo' | 'link' | 'progress' | 'result';

interface Extracted {
  name: string; type: string; text: string;
  images: any[]; file: File | null; topics?: any[];
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('read_failed'));
    fr.readAsDataURL(file);
  });
}

// Downscale a photo so we upload far less to Gemini and store less on device.
async function downscaleImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    return blob || file;
  } catch { return file; }
}

@Component({
  selector: 'app-import',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './import.html',
})
export class ImportPage {
  private router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly dropArt = dropzoneArt;
  readonly formats = ['PDF', 'DOCX', 'PPTX', 'TXT', 'MD'];
  stage = signal<Stage>('drop');
  folders: string[] = [];
  dragging = false;

  pasteName = '';
  pasteText = '';

  linkUrl = '';
  linkBusy = signal(false);
  linkError = signal('');
  // When YouTube refuses the automatic transcript read (it bot-blocks
  // server-side readers), guide the user through copying it instead.
  ytGuide = signal<{ title: string } | null>(null);

  docName = '';
  docFolder = '';
  docTags = '';
  wordCount = 0;
  imageCount = 0;
  tldr = '';
  topics: any[] = [];
  preview = '';
  extractFileName = '';
  steps: { label: string; state: '' | 'active' | 'done' }[] = [];
  private extracted: Extracted | null = null;

  async ngOnInit() {
    this.folders = deriveFolders(await listDocs());
  }

  async ionViewWillEnter() {
    // refresh folder suggestions every time the tab is opened
    this.folders = deriveFolders(await listDocs());
  }

  /** Clear everything after a save (or discard) so the next upload starts fresh —
   * Ionic keeps this page alive, so stale state would otherwise resurface. */
  private resetImport() {
    this.extracted = null;
    this.stage.set('drop');
    this.docName = '';
    this.docFolder = '';
    this.docTags = '';
    this.wordCount = 0;
    this.imageCount = 0;
    this.tldr = '';
    this.topics = [];
    this.preview = '';
    this.pasteName = '';
    this.pasteText = '';
    this.linkUrl = '';
    this.linkBusy.set(false);
    this.linkError.set('');
    this.ytGuide.set(null);
  }

  setMode(stage: Stage) {
    if (stage === 'link') { this.linkError.set(''); this.ytGuide.set(null); }
    this.stage.set(stage);
  }

  pickFile() { this.fileInput?.nativeElement.click(); }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging = true; }
  onDragLeave() { this.dragging = false; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    if (e.dataTransfer?.files.length) this.handleFile(e.dataTransfer.files[0]);
  }

  onFilePicked(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  requirePhotoKey(then: () => void) {
    if (!hasApiKey()) { this.toast.toast('Add a Gemini key in Settings to read photos', true); return; }
    then();
  }

  onPhotoPicked(e: Event, multiple: boolean) {
    const input = e.target as HTMLInputElement;
    const files = [...(input.files || [])].filter(f => f.type.startsWith('image/'));
    if (files.length) this.handlePhoto(multiple ? files : [files[0]]);
    input.value = '';
  }

  async savePaste() {
    const text = this.pasteText.trim();
    if (text.length < 20) { this.toast.toast('Paste a bit more text to study', true); return; }
    this.showExtracted({ name: this.pasteName.trim() || 'Pasted notes', type: 'txt', text, images: [], file: null });
  }

  async fetchLink() {
    const url = this.linkUrl.trim();
    if (!isProbablyArticleUrl(url)) { this.linkError.set('Enter a full link starting with https://'); return; }
    this.linkBusy.set(true);
    this.linkError.set('');
    try {
      const { title, text, kind } = await extractUrl(url);
      let host = 'Web page';
      try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep */ }
      this.showExtracted({ name: (title || host).slice(0, 80), type: kind === 'youtube' ? 'youtube' : 'link', text, images: [], file: null });
      this.linkUrl = '';
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      // YouTube bot-blocks server-side transcript reads — fall back to the
      // copy-the-transcript guide instead of a dead-end error.
      if (youTubeVideoId(url) && /no_captions|yt_login_required|youtube_unreachable|site_http_429|fetch_failed/i.test(code)) {
        try {
          const { title } = await youTubeTitle(url);
          this.ytGuide.set({ title: title.slice(0, 80) });
        } catch {
          this.ytGuide.set({ title: '' });
        }
      } else {
        this.linkError.set(code || 'Could not extract that page');
      }
    } finally {
      this.linkBusy.set(false);
    }
  }

  openPasteForTranscript() {
    const guide = this.ytGuide();
    this.pasteName = guide?.title ? `Transcript — ${guide.title}` : 'YouTube transcript';
    this.ytGuide.set(null);
    this.stage.set('paste');
  }

  private setSteps(labels: string[]) {
    this.steps = labels.map(label => ({ label, state: '' as const }));
  }

  private async handleFile(file: File) {
    if (!detectType(file.name)) { this.toast.toast('Only PDF, DOCX, PPTX, TXT or MD files are supported', true); return; }
    if (file.size > 50 * 1024 * 1024) { this.toast.toast('File is too large (max 50MB)', true); return; }

    this.setSteps(['Reading file…', 'Extracting text…', 'Saving locally…']);
    this.extractFileName = file.name;
    this.stage.set('progress');

    try {
      this.steps[0].state = 'active';
      await new Promise(r => setTimeout(r, 250));
      this.steps[0].state = 'done'; this.steps[1].state = 'active';

      const { type, text } = await extractText(file);
      const images = await extractImages(file, type);

      this.steps[1].state = 'done'; this.steps[2].state = 'active';
      await new Promise(r => setTimeout(r, 350));
      this.steps[2].state = 'done';
      this.showExtracted({ name: file.name.replace(/\.(pdf|docx|pptx|txt|md|markdown)$/i, ''), type, text, images, file });
    } catch (err: any) {
      console.error(err);
      this.toast.toast(err?.message || 'Could not read this file', true);
      this.stage.set('drop');
    }
  }

  private async handlePhoto(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) { this.toast.toast('Choose image files', true); return; }
    const n = images.length;
    this.extractFileName = n === 1 ? (images[0].name || 'Photo') : `${n} photos`;
    this.setSteps([`Reading ${n} image${n === 1 ? '' : 's'}…`, 'Transcribing with Gemini…']);
    this.steps[0].state = 'active';
    this.stage.set('progress');
    try {
      const parts: string[] = [];
      const blobs: Blob[] = [];
      for (const img of images) {
        try {
          const small = await downscaleImage(img);
          blobs.push(small);
          const dataUrl = await fileToDataUrl(small);
          const text = await transcribeImage(dataUrl, { maxOutputTokens: 4096 });
          if (text && text.trim()) parts.push(text.trim());
        } catch (e) { console.warn('photo transcribe failed', e); }
      }
      this.steps[0].state = 'done'; this.steps[1].state = 'done';
      const combined = parts.join('\n\n');
      if (!combined.trim()) throw new Error('No readable text found in those images');
      this.showExtracted({
        name: (images[0].name || 'Photo notes').replace(/\.[^.]+$/, '') || 'Photo notes',
        type: 'image',
        text: combined,
        images: blobs.map((b, i) => ({ blob: b, mimeType: b.type || 'image/jpeg', index: i, slideNumber: i + 1 })),
        file: null
      });
    } catch (err: any) {
      console.error(err);
      this.toast.toast(err?.message || 'Could not read these photos', true);
      this.stage.set('photo');
    }
  }

  private showExtracted(ex: Extracted) {
    this.extracted = ex;
    this.wordCount = (ex.text.match(/\S+/g) || []).length;
    this.imageCount = ex.images.length;
    const { topics } = detectTopics(ex.text);
    this.topics = topics;
    ex.topics = topics;
    this.tldr = oneLineSummary(ex.text);
    this.docName = ex.name;
    this.preview = ex.text.slice(0, 600) + (ex.text.length > 600 ? '…' : '');
    setTimeout(() => this.stage.set('result'), 300);
  }

  async saveDoc() {
    if (!this.extracted) return;
    const name = this.docName.trim() || 'Untitled document';
    const folder = this.docFolder.trim() || null;
    const tags = this.docTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 12);
    const doc = await saveDoc({ name, type: this.extracted.type, text: this.extracted.text, topics: this.extracted.topics || [], folder, tags, original: this.extracted.file });
    if (this.extracted.images?.length) {
      await saveDocImages(doc.id, this.extracted.images.map((img, i) => ({ ...img, index: i })));
    }
    this.toast.toast('Document saved ✓');
    this.resetImport();
    this.folders = deriveFolders(await listDocs());
    this.router.navigateByUrl('/tabs/library');
  }

  discard() {
    this.resetImport();
    this.stage.set('drop');
  }

  backToLibrary() { this.router.navigateByUrl('/tabs/library'); }
  toggleTheme() { this.ui.toggleTheme(); }
}
