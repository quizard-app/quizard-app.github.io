import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { IcoPipe } from '../../shared/ico.pipe';

@Component({
  selector: 'app-reports',
  imports: [IonContent, IcoPipe],
  template: `
    <ion-content [fullscreen]="true">
      <header class="app-header">
        <div class="brand"><span class="mark" [innerHTML]="'logo' | ico"></span>Results</div>
      </header>
      <div class="screen screen-center">
        <div class="empty-state">
          <div class="empty-ico" [innerHTML]="'chart' | ico"></div>
          <h3>Results live here soon</h3>
          <p>Once papers are checked, class score lists, item analysis, and CSV/PDF exports appear here. Arriving in a later update.</p>
        </div>
      </div>
    </ion-content>
  `,
})
export class ReportsPage {}
