import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { IdlePreloadService } from './core/services/idle-preload.service';
import { ByokService } from './core/services/byok.service';
import { ConfirmService } from './core/services/confirm.service';
import { IcoPipe } from './shared/ico.pipe';
import { afterNextRender } from '@angular/core';

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

  openKeyPage() { window.open('https://aistudio.google.com/apikey', '_blank', 'noopener'); }

  constructor() {
    afterNextRender(() => this.preload.start());
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
