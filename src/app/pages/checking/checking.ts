import { Component, computed, inject, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { listClasses, listQuizzes, saveSheet, listSheets, deleteSheet, getQuiz } from '../../core/engine/storage.js';
import { readSheet, scoreSheet, decodeQr, FLAG } from '../../core/engine/omr.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-checking',
  imports: [IonContent, IcoPipe],
  templateUrl: './checking.html',
})
export class CheckingPage {
  router = inject(Router);
  ui = inject(UiStateService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  stage = signal<'setup' | 'scan' | 'result'>('setup');
  classes = signal<any[]>([]);
  quizzes = signal<any[]>([]);
  classId = signal<string | null>(null);
  quizOverrideId = signal<string | null>(null);
  session = signal<any[]>([]);

  processing = signal(false);
  scanError = signal('');
  qrHit = signal<string | null>(null);
  detectedQuiz = signal<any>(null);
  answers = signal<number[]>([]);
  flags = signal<string[]>([]);
  photo = signal<string>('');
  studentName = signal('');

  cameraActive = signal(false);
  private stream: MediaStream | null = null;

  readonly flag = FLAG;
  readonly pickedClass = computed(() => this.classes().find(c => c.id === this.classId()) || null);
  readonly scored = computed(() => {
    const quiz = this.detectedQuiz();
    if (!quiz) return null;
    return scoreSheet(this.answers(), quiz.items);
  });
  readonly letters = ['A', 'B', 'C', 'D'];

  async ionViewWillEnter() {
    this.classes.set(await listClasses());
    this.quizzes.set(await listQuizzes());
  }

  // ── setup ──
  async startSession() {
    if (!this.classId()) return;
    await this.refreshSession();
    this.stage.set('scan');
  }

  async refreshSession() {
    this.session.set(await listSheets({ classId: this.classId() || undefined }));
  }

  // ── camera ──
  async openCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      this.cameraActive.set(true);
      setTimeout(() => {
        const video = document.querySelector('video.camera-view') as HTMLVideoElement | null;
        if (video) { video.srcObject = this.stream; void video.play(); }
      });
    } catch {
      this.toast.toast('Camera unavailable — use “Check from photo” instead', true);
    }
  }

  closeCamera() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.cameraActive.set(false);
  }

  captureFromCamera() {
    const video = document.querySelector('video.camera-view') as HTMLVideoElement | null;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1600 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    this.closeCamera();
    void this.processImage(data);
  }

  async onPhoto(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1600 / bitmap.width);
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    input.value = '';
    void this.processImage(data);
  }

  private async processImage(data: ImageData) {
    this.processing.set(true);
    this.scanError.set('');
    // let the spinner paint before the synchronous CV work blocks the frame
    await new Promise(r => setTimeout(r, 60));

    // the QR identifies the quiz before any geometry work — one CV pass total
    const qr = decodeQr(data.data, data.width, data.height);
    const qrId = qr?.startsWith('QZ1:') ? qr.slice(4) : null;
    const quizId = qrId || this.quizOverrideId();
    const quiz = quizId ? await getQuiz(quizId) : null;
    if (!quiz) {
      this.processing.set(false);
      this.scanError.set('This sheet’s quiz isn’t on this device — pick the quiz manually on the setup screen and scan again.');
      return;
    }

    const result = readSheet({ data: data.data, width: data.width, height: data.height }, quiz.items.length);
    if (!result.ok) {
      this.processing.set(false);
      this.scanError.set('Could not align the sheet — make sure all four corner squares and the black frame are fully visible, then try again.');
      return;
    }
    const answers = result.answers, flags = result.flags;
    this.zone.run(() => {
      this.qrHit.set(result.qr);
      this.detectedQuiz.set(quiz);
      this.answers.set(answers);
      this.flags.set(flags);
      this.photo.set(dataToJpeg(data));
      this.studentName.set('');
      this.stage.set('result');
      this.processing.set(false);
    });
  }

  // ── result editor ──
  cycleAnswer(i: number) {
    const next = [...this.answers()];
    next[i] = next[i] >= 3 ? -1 : next[i] + 1;
    const flags = [...this.flags()];
    flags[i] = next[i] >= 0 ? FLAG.OK : FLAG.BLANK;
    this.answers.set(next);
    this.flags.set(flags);
  }

  setAnswer(i: number, b: number) {
    const next = [...this.answers()];
    next[i] = b;
    const flags = [...this.flags()];
    flags[i] = FLAG.OK;
    this.answers.set(next);
    this.flags.set(flags);
  }

  async saveResult() {
    const quiz = this.detectedQuiz();
    const cls = this.pickedClass();
    const s = this.scored();
    if (!quiz || !cls || !s || !this.studentName().trim()) return;
    await saveSheet({
      classId: cls.id, className: cls.name, quizId: quiz.id,
      studentName: this.studentName().trim(),
      answers: this.answers(), flags: this.flags(),
      correct: s.correct, total: s.total, percent: s.percent,
      photo: this.photo() || undefined,
    });
    await this.refreshSession();
    this.stage.set('scan');
    this.toast.toast(`Saved — ${this.studentName().trim()} scored ${s.percent}%`);
  }

  async undoLast() {
    const last = this.session()[0];
    if (!last) return;
    await deleteSheet(last.id);
    await this.refreshSession();
    this.toast.toast('Last result removed');
  }

  endSession() {
    this.stage.set('setup');
    this.detectedQuiz.set(null);
    this.answers.set([]);
    this.flags.set([]);
    this.photo.set('');
  }

  flagColor(f: string) {
    return f === FLAG.MULTI ? 'bad' : f === FLAG.FAINT ? 'warn' : f === FLAG.BLANK ? 'dim' : 'good';
  }
}

function dataToJpeg(data: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = data.width; canvas.height = data.height;
  canvas.getContext('2d')!.putImageData(data, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.6);
}
