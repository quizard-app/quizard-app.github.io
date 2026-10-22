import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IdlePreloadService } from './core/services/idle-preload.service';
import { ByokService } from './core/services/byok.service';
import { ConfirmService } from './core/services/confirm.service';
import { InstallService } from './core/services/install.service';
import { UiStateService } from './core/services/ui-state.service';
import { maybeAutoPush } from './core/engine/sync.js';
import { IcoPipe } from './shared/ico.pipe';
import { afterNextRender, effect } from '@angular/core';

// Eager shell: under zoneless CD (Angular 22 makes OnPush the default) an
// OnPush shell strands ion-router-outlet pages — stuck `ion-page-invisible`,
// dead deep-linked pages. Required on every component between the root and
// the outlet (see Ionic zoneless guide).
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IcoPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App {
  // inject() runs here, inside the component's injection context — calling it
  // inside the afterNextRender callback instead throws NG0203.
  private preload = inject(IdlePreloadService);
  private swUpdate = inject(SwUpdate, { optional: true });
  readonly byok = inject(ByokService);
  readonly confirm = inject(ConfirmService);
  readonly install = inject(InstallService);
  private ui = inject(UiStateService);

  openKeyPage() {
    const url = this.byok.providerConfig?.keyUrl;
    if (url) window.open(url, '_blank', 'noopener');
  }

  constructor() {
    afterNextRender(() => this.preload.start());
    if (Capacitor.isNativePlatform()) {
      // An APK upgrade must never run the previous build out of a service
      // worker cache: the bundled assets are the truth on the device. Older
      // installs may still have a registration — drop it and its caches.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(rs => rs.forEach(r => r.unregister()))
          .catch(() => {});
        if ('caches' in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
        }
      }
      // Edge-to-edge draws the app under the status bar, so its icons must
      // contrast with the APP theme (light app → dark icons, dark app → light)
      effect(() => {
        const style = this.ui.theme() === 'dark' ? Style.Dark : Style.Light;
        StatusBar.setStyle({ style }).catch(() => {});
      });
    }
    // Quiet cloud sync: when sync is on, push an encrypted snapshot when the
    // student leaves the tab/app (throttled inside maybeAutoPush). Never throws.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') void maybeAutoPush();
      });
      window.addEventListener('pagehide', () => { void maybeAutoPush(); });
    }
    // Apply app updates on the FIRST reload: when the service worker detects a
    // new version it downloads it, we activate immediately and reload once.
    // Without this, users need two manual refreshes (or never see updates).
    if (this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter(e => e.type === 'VERSION_READY'))
        .subscribe(() => {
          this.swUpdate!.activateUpdate().then(updated => {
            if (updated && !sessionStorage.getItem('ngsw-just-updated')) {
              sessionStorage.setItem('ngsw-just-updated', '1');
              document.location.reload();
            }
          });
        });
      this.swUpdate.unrecoverable.subscribe(() => {
        sessionStorage.removeItem('ngsw-just-updated');
        if (confirm('The app updated in the background and needs a reload. Reload now?')) {
          document.location.reload();
        }
      });
    }
  }
}
