import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ShareModalComponent } from './shared/share-modal.component';
import { IdlePreloadService } from './core/services/idle-preload.service';
import { afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, ShareModalComponent],
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
