import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { IcoPipe } from '../../shared/ico.pipe';

@Component({
  selector: 'app-create',
  imports: [IonContent, IcoPipe],
  template: `
    <ion-content [fullscreen]="true">
      <header class="app-header">
        <div class="brand"><span class="mark" [innerHTML]="'logo' | ico"></span>Create</div>
      </header>
      <div class="screen screen-center">
        <div class="empty-state">
          <div class="empty-ico" [innerHTML]="'sparkles' | ico"></div>
          <h3>Quiz creation is on its way</h3>
          <p>Upload your lesson file (PDF, PowerPoint, Word) and let AI write the quiz from your answer key — then print it with matching bubble sheets. Arriving in the next update.</p>
        </div>
      </div>
    </ion-content>
  `,
})
export class CreatePage {}
