import { Component, computed, inject, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { listClasses, listQuizzes, saveSheet, listSheets, deleteSheet, getQuiz } from '../../core/engine/storage.js';
import { readSheet, scoreSheet, decodeQr, FLAG } from '../../core/engine/omr.js';
import { parseSheetQr, resolveSheetStudent } from '../../core/engine/sheet-spec.js';
import { planSheet, renderSyntheticSheet, SCENARIOS, scenarioById } from '../../core/engine/sheet-synth.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { UiStateService } from '../../core/services/ui-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ByokService } from '../../core/services/byok.service';
import { isDevHost } from '../../core/dev-only';
import { bannerTheme } from '../../shared/helpers.js';

/**
 * A roster student resolved for one sheet. `grade` / `section` fall back to the
 * class-level values when the student row leaves them blank, so every result
 * carries a section even for a class with one section for all.
 */
interface MatchedStudent {
  id: string;
  no?: number;
  name: string;
  grade: string;
  section: string;
  classId: string;
  className: string;
}

@Component({
  selector: 'app-checking',
  imports: [IonContent, IcoPipe],
  templateUrl: './checking.html',
})
export class CheckingPage {
  router = inject(Router);
  ui = inject(UiStateService);
  readonly byok = inject(ByokService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  stage = signal<'setup' | 'scan' | 'result'>('setup');
  classes = signal<any[]>([]);
  quizzes = signal<any[]>([]);
  sheets = signal<any[]>([]);
  classId = signal<string | null>(null);
  quizOverrideId = signal<string | null>(null);
  quizPickOpen = signal(false);
  session = signal<any[]>([]);

  // Templates can't see bare imports, so the shared banner theme is exposed as
  // a field — a class wears the same gradient here as on Classes and roster.
  readonly bannerTheme = bannerTheme;

  processing = signal(false);
  scanError = signal('');
  qrHit = signal<string | null>(null);
  detectedQuiz = signal<any>(null);
  answers = signal<number[]>([]);
  flags = signal<string[]>([]);
  photo = signal<string>('');
  studentName = signal('');
  autoStudent = signal<MatchedStudent | null>(null);
  // how the sheet got its student: the sheet's own QR, or the result-screen
  // picker when the QR named nobody
  studentSource = signal<'qr' | 'manual' | null>(null);
  // a QR named a student this device's roster doesn't have — the teacher still
  // picks manually, but knows the sheet's claim
  qrUnknownName = signal<string | null>(null);
  pickedStudentId = signal<string | null>(null);
  studentPickOpen = signal(false);

  // The score that pops up over the scanner the moment a sheet is read and
  // recorded, so the teacher sees the result without tapping through a screen.
  // Shaped by recordResult(); null means no popup.
  scorePop = signal<{ id: string; name: string; section: string; percent: number; correct: number; total: number } | null>(null);

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

  // Every student across every class, in the shape a result needs. Building the
  // option list from the same entries the auto-match uses means the manual
  // fallback attaches the same identity data as a numbered scan.
  readonly roster = computed<MatchedStudent[]>(() =>
    this.classes().flatMap(cls => (cls.students || []).map((st: any) => this.rosterEntry(cls, st))));

  // The class being checked scopes both pickers — a session is per class, so a
  // 200-student school never scrolls one giant list.
  readonly classRoster = computed(() =>
    this.roster().filter(r => r.classId === this.classId()));

  private rosterEntry(cls: any, st: any): MatchedStudent {
    return {
      id: st.id,
      no: st.no,
      name: st.name,
      grade: st.grade || cls.grade || '',
      section: st.section || cls.section || '',
      classId: cls.id,
      className: cls.name,
    };
  }


  subjectMismatch = signal(false);

  selectStudent(id: string) {
    const st = this.roster().find(r => r.id === id) || null;
    this.attachStudent(st, 'manual');
    this.qrUnknownName.set(null);
  }

  // One place that binds a roster student to the sheet being checked, so the
  // QR path and the manual picker carry identical identity data.
  private attachStudent(st: MatchedStudent | null, source: 'qr' | 'manual' | null) {
    this.pickedStudentId.set(st?.id ?? null);
    this.autoStudent.set(st);
    this.studentName.set(st?.name ?? '');
    this.studentSource.set(source);
    // the subject guard applies to manual picks too — a sheet from another
    // subject's pile would otherwise land on the wrong class silently
    const quiz = this.detectedQuiz();
    const cls = st ? this.classes().find(c => c.id === st.classId) : null;
    this.subjectMismatch.set(!!cls?.subject && !!quiz?.subject &&
      cls.subject.toLowerCase() !== quiz.subject.toLowerCase());
  }

  // A roster-printed sheet's QR carries the student id and name: id first
  // (stable across roster edits), then the name as the fallback for a roster
  // that was re-created on this device. The rule lives in sheet-spec.js so it
  // is covered by the same tests as the parser.
  private matchRosterStudent(parsed: { studentId: string | null; studentName: string | null } | null) {
    return resolveSheetStudent(this.roster(), parsed, this.classId());
  }

  async ionViewWillEnter() {
    const [classes, quizzes, sheets] = await Promise.all([listClasses(), listQuizzes(), listSheets()]);
    this.classes.set(classes);
    this.quizzes.set(quizzes);
    this.sheets.set(sheets);
    // Landing from a quiz's detail page (?quiz=): that quiz is the session's
    // target before any scanning starts.
    const qm = /[?&]quiz=([A-Za-z0-9-]+)/.exec(this.router.url || '');
    if (qm) this.quizOverrideId.set(qm[1]);
  }

  // Per-class scan totals, so a class card shows whether a pile was started —
  // the same count the roster hero and Results use.
  readonly checkedCount = (cls: any): number =>
    this.sheets().filter(s => s.classId === cls.id).length;

  // ── quiz picker (setup) ──
  // A session's quiz comes off each sheet's QR in almost every scan, so the
  // full quiz library never sits on the setup screen — the pill opens a sheet
  // filtered to the picked class's subject first.
  readonly classSubjectQuizzes = computed(() => {
    const sub = (this.pickedClass()?.subject || '').trim().toLowerCase();
    if (!sub) return [];
    return this.quizzes().filter(q => (q.subject || '').trim().toLowerCase() === sub);
  });
  readonly otherQuizzes = computed(() => {
    const own = new Set(this.classSubjectQuizzes().map(q => q.id));
    return this.quizzes().filter(q => !own.has(q.id));
  });
  readonly othersLabel = computed(() =>
    (this.pickedClass()?.subject || '').trim() ? 'Other subjects' : 'All quizzes');

  quizLabel(id: string): string {
    const q = this.quizzes().find(x => x.id === id);
    if (!q) return 'Quiz';
    return `${q.subject || 'Quiz'}${q.title ? ' — ' + q.title : ''} · ${q.items?.length || 0} items`;
  }

  setQuiz(id: string | null) {
    this.quizOverrideId.set(id);
    this.quizPickOpen.set(false);
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

    // the QR identifies the quiz — and, on roster-printed sheets, the student
    // — before any geometry work: one CV pass total
    const parsed = parseSheetQr(decodeQr(data.data, data.width, data.height));
    const quizId = parsed?.quizId || this.quizOverrideId();
    const quiz = quizId ? await getQuiz(quizId) : null;
    if (!quiz) {
      this.processing.set(false);
      // two different failures wore one message before: a photo with no
      // readable QR at all, and a QR naming a quiz this device doesn't have
      // (sheets printed on another phone / browser, or a deleted quiz)
      this.scanError.set(parsed
        ? `This sheet’s quiz isn’t on this device${parsed.studentName ? ` (the QR names ${parsed.studentName})` : ''} — it was printed somewhere else or deleted here. Pick the quiz manually on the setup screen and scan again.`
        : 'No QR code found on that photo — fill the frame with the sheet, keep it flat and well-lit, then try again. Or pick the quiz manually on the setup screen to scan without one.');
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
      // Sheets are printed one per roster student, so the QR almost always
      // names whose paper this is — it attaches with nothing to confirm. Only
      // a sheet whose QR names nobody (or names a student this device doesn't
      // have) waits for the teacher, and that pick happens on the result screen.
      const qrStudent = this.matchRosterStudent(parsed);
      if (qrStudent) {
        this.qrUnknownName.set(null);
        this.attachStudent(qrStudent, 'qr');
        // Nothing left to confirm, so record it now and pop the score up over
        // the scanner — the teacher never taps through a result screen.
        this.stage.set('scan');
        void this.recordResult().then(row => { if (row) this.scorePop.set(row); });
      } else {
        this.attachStudent(null, null);
        this.qrUnknownName.set(parsed?.studentName || null);
        // Nobody in the QR: the result screen's picker decides whose paper it is
        this.stage.set('result');
      }
      this.processing.set(false);
    });
  }

  // ── dev-only scan tester (localhost builds only — see dev-only.ts) ──
  // Prints a fake filled sheet and feeds it to the very same processImage() a
  // camera capture uses, so the whole path — QR decode, quiz lookup, roster
  // match, OMR, scoring, save — is exercised without a printer or a camera.
  readonly devTest = isDevHost();
  readonly devScenarios = SCENARIOS;
  /** Sentinel for the "print a student-less sheet" option. Not a real id. */
  static readonly DEV_NO_STUDENT = '__none__';
  devScenario = signal(SCENARIOS[0].id);
  devAccuracy = signal(80);
  devStudentId = signal<string | null>(null);
  devSeed = signal(1);
  devRunning = signal(false);

  // Which student to print into the fake sheet's QR. null = untouched, so fall
  // back to the first on the roster and the scan identifies them on its own,
  // the way it does for a real roster-printed sheet. Picking the explicit
  // sentinel instead exercises the blank-QZ1 path where nobody is known.
  get devSheetStudent() {
    const id = this.devStudentId();
    if (id === CheckingPage.DEV_NO_STUDENT) return null;
    return this.classRoster().find(s => s.id === id) || this.classRoster()[0] || null;
  }

  // What the picker shows. Mirrors devSheetStudent, so the highlighted name is
  // always the one that will actually be printed into the fake QR.
  get devStudentPickerValue() {
    return this.devSheetStudent?.id ?? CheckingPage.DEV_NO_STUDENT;
  }

  async simulateScan() {
    if (!this.pickedClass()) return;
    const quiz = await this.devQuiz();
    if (!quiz) return;
    const key = (quiz.items || []).map((it: any) => it.answerIndex);
    if (key.some((k: any) => typeof k !== 'number')) {
      this.toast.toast('That quiz has no answer key — set one before simulating a scan', true);
      return;
    }
    const scenario = scenarioById(this.devScenario());
    const student = this.devSheetStudent;
    const plan = planSheet({
      itemCount: key.length, key,
      accuracy: this.devAccuracy() / 100,
      blanks: scenario.blanks, multis: scenario.multis,
      seed: this.devSeed(),
    });

    this.devRunning.set(true);
    // let the button paint before the synchronous canvas + CV work blocks the frame
    await new Promise(r => setTimeout(r, 60));
    try {
      const image = renderSyntheticSheet({
        itemCount: key.length, quizId: quiz.id, student, plan,
        rotate: scenario.rotate, noise: scenario.noise,
        pencil: scenario.pencil, dropMarker: !!scenario.dropMarker,
        seed: this.devSeed(),
      });
      await this.processImage(image);
    } finally {
      this.devRunning.set(false);
    }
  }

  // The sheet's QR has to name a quiz that exists on this device, or the scan
  // fails at the first step — so fall back to whatever is on hand.
  private async devQuiz() {
    const id = this.quizOverrideId() || this.quizzes()[0]?.id;
    if (!id) {
      this.toast.toast('Create a quiz first — the simulated sheet’s QR has to name one', true);
      return null;
    }
    return await getQuiz(id);
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

  // Writes the sheet being checked to storage and hands back the row it made.
  // Shared by the automatic scan path (which pops the score up straight away)
  // and the result screen's Save button. Identity comes from the roster entry,
  // never from the handwriting.
  //
  // Rescanning a paper is a correction, not a second sitting, so it replaces
  // the score that student already has for this quiz rather than stacking
  // another row — otherwise one sheet counts twice in the class average.
  private async recordResult() {
    const quiz = this.detectedQuiz();
    const auto = this.autoStudent();
    const cls = auto ? this.classes().find(c => c.id === auto.classId) || this.pickedClass() : this.pickedClass();
    const s = this.scored();
    const name = this.studentName().trim();
    if (!quiz || !cls || !s || !name) return null;
    const no = auto?.no ?? null;
    const prior = (await listSheets({ classId: cls.id, quizId: quiz.id }))
      .find(x => no != null ? x.studentNo === no : (!x.studentNo && x.studentName === name));
    const saved = await saveSheet({
      id: prior?.id,
      classId: cls.id, className: cls.name, quizId: quiz.id,
      studentNo: auto?.no ?? null,
      studentName: name,
      grade: auto?.grade ?? '',
      section: auto?.section ?? '',
      answers: this.answers(), flags: this.flags(),
      correct: s.correct, total: s.total, percent: s.percent,
      photo: this.photo() || undefined,
    });
    await this.refreshSession();
    return { id: saved.id, name, section: saved.section || '', percent: s.percent, correct: s.correct, total: s.total };
  }

  async saveResult() {
    const row = await this.recordResult();
    if (!row) return;
    this.stage.set('scan');
    this.scorePop.set(row);
  }

  // A misread must not be permanent: drop the row that was just written and
  // reopen the result screen, where the answer chips and the student can be
  // corrected before saving again.
  async fixScore() {
    const pop = this.scorePop();
    this.scorePop.set(null);
    if (!pop) return;
    await deleteSheet(pop.id);
    await this.refreshSession();
    this.stage.set('result');
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
    this.autoStudent.set(null);
    this.studentSource.set(null);
    this.qrUnknownName.set(null);
    this.scorePop.set(null);
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
