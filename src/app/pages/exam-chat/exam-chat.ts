import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { getDoc, listDocs, saveDoc, saveExam } from '../../core/engine/storage.js';
import { extractText } from '../../core/engine/extract/index.js';
import { detectTopics } from '../../core/engine/topics.js';
import { buildDigest, examChat } from '../../core/engine/exam-ai.js';
import { assetUrl } from '../../shared/assets.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';

interface Msg { role: 'user' | 'wizard'; text: string }
interface Draft {
  examTitle: string | null; examDate: string | null; topics: any[];
  matchedDocIds: string[]; missingTopics: string[]; readyToCreate: boolean;
}

@Component({
  selector: 'app-exam-chat',
  imports: [IonContent, FormsModule, IcoPipe],
  templateUrl: './exam-chat.html',
})
export class ExamChatPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private toast = inject(ToastService);

  @ViewChild('log') log?: ElementRef<HTMLElement>;
  @ViewChild('msgInput') msgInput?: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly wizImg = assetUrl('wizard/wizard-thinking.jpg');
  messages = signal<Msg[]>([]);
  coverage = signal<{ topics: any[]; missing: string[] }>({ topics: [], missing: [] });
  readyToCreate = signal(false);
  busy = false;
  inputValue = '';
  private draft: Draft = { examTitle: null, examDate: null, topics: [], matchedDocIds: [], missingTopics: [], readyToCreate: false };
  private conversation: Msg[] = [];
  private opened = false;

  ngOnInit() { setTimeout(() => this.greet(), 100); }
  ngOnDestroy() { /* nothing persistent */ }

  private async greet() {
    if (this.opened) return;
    this.opened = true;
    this.showTyping();
    await new Promise(r => setTimeout(r, 500));
    this.hideTyping();
    this.bubble('wizard', 'Ah, an exam approaches… Tell me what it covers — paste your teacher\'s announcement or just describe it. Then we\'ll gather every file you need.');
  }

  private bubble(role: 'user' | 'wizard', text: string) {
    this.conversation.push({ role, text });
    this.messages.update(m => [...m, { role, text }]);
    setTimeout(() => { const l = this.log?.nativeElement; if (l) l.scrollTop = l.scrollHeight; }, 50);
  }

  typing = signal(false);

  private showTyping() {
    this.typing.set(true);
    setTimeout(() => { const l = this.log?.nativeElement; if (l) l.scrollTop = l.scrollHeight; }, 30);
  }

  private hideTyping() { this.typing.set(false); }

  private renderCoverage() {
    const draft = this.draft;
    const topics = draft.topics.length ? draft.topics : draft.missingTopics.map(t => ({ title: t, missing: true }));
    this.coverage.set({ topics, missing: draft.missingTopics });
    this.readyToCreate.set(draft.readyToCreate);
  }

  private async askWizard(userText: string) {
    this.bubble('user', userText);
    this.showTyping();
    this.busy = true;
    try {
      const docs = await listDocs();
      const digest: any[] = [];
      for (const m of docs.slice(0, 40)) {
        const full = await getDoc(m.id).catch(() => null);
        if (full?.text) digest.push(...buildDigest([full]));
      }
      const state = await examChat(this.conversation as any, digest, this.draft);
      this.draft = {
        examTitle: state.examTitle || this.draft.examTitle,
        examDate: state.examDate || this.draft.examDate,
        topics: this.mergeTopics(this.draft.topics, state.topics),
        matchedDocIds: [...new Set([...this.draft.matchedDocIds, ...state.matchedDocIds])],
        missingTopics: state.missingTopics,
        readyToCreate: state.readyToCreate
      };
      this.hideTyping();
      this.bubble('wizard', state.reply);
    } catch {
      this.hideTyping();
      this.bubble('wizard', 'Something interfered with my crystal ball — try sending that again.');
    }
    this.renderCoverage();
    this.busy = false;
  }

  private mergeTopics(oldTopics: any[], newTopics: any[]) {
    const out = [...oldTopics];
    for (const t of newTopics) {
      if (!out.some(o => o.title.toLowerCase() === t.title.toLowerCase())) out.push(t);
    }
    return out;
  }

  send() {
    const text = this.inputValue.trim();
    if (!text || this.busy) return;
    this.inputValue = '';
    this.msgInput?.nativeElement.focus();
    void this.askWizard(text);
  }

  openFile() { this.fileInput?.nativeElement.click(); }

  async onFilePicked(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy) return;
    this.busy = true;
    this.showTyping();
    try {
      const res = await extractText(file);
      const { topics } = detectTopics(res.text);
      await saveDoc({ name: file.name, type: res.type, text: res.text, topics: topics.map(tp => tp.title) });
      this.hideTyping();
      this.bubble('user', `📎 Uploaded ${file.name}`);
      void this.askWizard(`I just uploaded new files for this exam — please re-check what's covered.`);
    } catch {
      this.hideTyping();
      this.bubble('wizard', `I could not read ${file.name} — PDF, DOCX, PPTX, TXT or MD only.`);
      this.busy = false;
    }
  }

  coveredTopic(t: any): boolean {
    const matched = new Set(this.draft.matchedDocIds);
    return !t.missing && (t.docId ? matched.has(t.docId) : matched.size > 0);
  }

  async create() {
    if (!this.draft.readyToCreate || this.busy) return;
    const exam = {
      id: 'exam-' + Date.now().toString(36),
      title: this.draft.examTitle || 'Exam Prep',
      examDate: this.draft.examDate ? new Date(this.draft.examDate + 'T23:59:59').getTime() : undefined,
      createdAt: Date.now(),
      announcement: this.conversation.find(m => m.role === 'user')?.text || '',
      docIds: this.draft.matchedDocIds,
      topics: this.draft.topics,
      status: 'upcoming'
    };
    await saveExam(exam as any);
    this.toast.toast(`Exam "${exam.title}" created ✓`);
    this.router.navigate(['/exams', exam.id]);
  }

  backToExams() { this.router.navigateByUrl('/exams'); }
}
