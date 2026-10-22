import { Injectable, computed, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

// The APK lives on the latest GitHub Release under a stable asset name, so the
// link keeps working when a new build replaces the previous upload.
const APK_URL = 'https://github.com/quizard-app/quizard-app.github.io/releases/latest/download/Quizard.apk';
const DISMISS_KEY = 'quizard.install-dismissed';

function standaloneNow(): boolean {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class InstallService {
  readonly native = Capacitor.isNativePlatform();
  readonly isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  readonly apkUrl = APK_URL;

  readonly canInstall = signal(false);
  readonly dismissed = signal(this.readDismissed());
  readonly standalone = signal(standaloneNow());

  // Shown on the web only: Android always gets the APK option, while other
  // browsers keep it once they offer a native install prompt.
  readonly showBanner = computed(() =>
    !this.native && !this.standalone() && !this.dismissed() && (this.canInstall() || this.isAndroid)
  );

  private deferred: any = null;

  constructor() {
    if (this.native || typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferred = event;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canInstall.set(false);
      this.dismiss();
    });
  }

  async installPwa(): Promise<void> {
    const event = this.deferred;
    if (!event) return;
    this.deferred = null;
    try {
      event.prompt();
      await event.userChoice;
    } catch {
      // The browser may refuse a second prompt; the menu fallback still works.
    }
    this.canInstall.set(false);
  }

  dismiss(): void {
    this.dismissed.set(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  }

  private readDismissed(): boolean {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  }
}
