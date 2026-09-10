import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { getDoc, updateDoc, deleteDoc, listDocs, deriveFolders } from '../../core/engine/storage.js';
import { hasApiKey } from '../../core/engine/gemini.js';
import { ensureVisualAnalysis } from '../../core/engine/quiz-ai.js';
import { icon } from '../../shared/icons.js';
import { typeLabel, fmtDate } from '../../shared/helpers.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-docdetail',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './docdetail.html',
})
export class DocDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly icons = { rename: icon('fileText') };
  doc = signal<any>(null);
  folders: string[] = [];
  name = '';
  folder = '';
  tags = '';
  showFull = false;
  analyzing = false;
  fmt = fmtDate;
  isArray = Array.isArray;
  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  focusName() {
    const el = this.nameInput?.nativeElement;
    if (!el) return;
    el.focus(); el.select(); el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const doc = await getDoc(id);
    if (!doc) { this.router.navigateByUrl('/tabs/library'); return; }
    this.doc.set(doc);
    this.name = doc.name;
    this.folder = doc.folder || '';
    this.tags = (doc.tags || []).join(', ');
    this.folders = deriveFolders(await listDocs()).filter((f: string) => f !== doc.folder);
  }

  typeOf(doc: any) { return typeLabel(doc.type); }

  get previewText() {
    const doc = this.doc();
    if (!doc) return '';
    return this.showFull ? doc.text : doc.text.slice(0, 400) + (doc.text.length > 400 ? '…' : '');
  }

  async saveName() {
    const doc = this.doc();
    const name = this.name.trim();
    if (!name) { this.toast.toast('Name cannot be empty', true); return; }
    if (name === doc.name) { this.toast.toast('Name unchanged'); return; }
    await updateDoc(doc.id, { name });
    this.toast.toast('Renamed ✓');
    await this.load();
  }

  async saveOrg() {
    const doc = this.doc();
    const folder = this.folder.trim() || null;
    const tags = this.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 12);
    await updateDoc(doc.id, { folder, tags });
    this.toast.toast('Saved ✓');
    await this.load();
  }

  toggleFull() { this.showFull = !this.showFull; }

  goSetup() { this.router.navigate(['/doc', this.doc().id, 'setup']); }
  goReviewer() { this.router.navigate(['/reviewer', this.doc().id]); }
  goFlashcards() { this.router.navigate(['/flashcards', this.doc().id]); }
  goLibrary() { this.router.navigateByUrl('/tabs/library'); }

  async analyzeVisuals() {
    const doc = this.doc();
    if (!hasApiKey()) { this.toast.toast('Add a Gemini key in Settings to analyze visuals', true); return; }
    this.analyzing = true;
    try {
      const analysis = await ensureVisualAnalysis(doc);
      if (!analysis || !analysis.elements.length) this.toast.toast('No diagrams, code or charts found');
      else this.toast.toast(`Analyzed ${analysis.elements.length} visual${analysis.elements.length === 1 ? '' : 's'} ✓`);
      await this.load();
    } catch {
      this.toast.toast('Visual analysis failed', true);
    } finally {
      this.analyzing = false;
    }
  }

  async remove() {
    const doc = this.doc();
    if (!await this.confirm.confirm(`Delete "${doc.name}"?`, `All quiz history for <b>${doc.name}</b> will be removed.`)) return;
    await deleteDoc(doc.id);
    this.toast.toast('Document deleted');
    this.goLibrary();
  }
}
