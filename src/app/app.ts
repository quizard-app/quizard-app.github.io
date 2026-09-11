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
  constructor() {
    afterNextRender(() => inject(IdlePreloadService).start());
  }
}
