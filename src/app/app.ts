import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { IdlePreloadService } from './core/services/idle-preload.service';
import { afterNextRender } from '@angular/core';

// Eager shell: under zoneless CD (Angular 22 makes OnPush the default) an
// OnPush shell strands ion-router-outlet pages — stuck `ion-page-invisible`,
// dead deep-linked pages. Required on every component between the root and
// the outlet (see Ionic zoneless guide).
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App {
  // inject() runs here, inside the component's injection context — calling it
  // inside the afterNextRender callback instead throws NG0203.
  private preload = inject(IdlePreloadService);

  constructor() {
    afterNextRender(() => this.preload.start());
  }
}
