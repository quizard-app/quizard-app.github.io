import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ShareModalComponent } from './shared/share-modal.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, ShareModalComponent],
  templateUrl: './app.html',
})
export class App {}
