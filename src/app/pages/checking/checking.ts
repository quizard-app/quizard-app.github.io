import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { IcoPipe } from '../../shared/ico.pipe';

@Component({
  selector: 'app-checking',
  imports: [IonContent, IcoPipe],
  template: `
    <ion-content [fullscreen]="true">
      <header class="app-header">
        <div class="brand"><span class="mark" [innerHTML]="'logo' | ico"></span>Check papers</div>
      </header>
      <div class="screen screen-center">
        <div class="empty-state">
          <div class="empty-ico" [innerHTML]="'scan' | ico"></div>
          <h3>Paper checking is on its way</h3>
          <p>Photograph each filled bubble sheet and the app reads the shaded answers offline — no internet needed — then scores against your key. Arriving soon.</p>
        </div>
      </div>
    </ion-content>
  `,
})
export class CheckingPage {}
