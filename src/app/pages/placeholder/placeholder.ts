import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

// Temporary stand-in for screens that are not ported yet — carries the
// screen's title and the milestone that will deliver it.
@Component({
  selector: 'app-placeholder',
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>This screen arrives in {{ milestone }} of the Ionic migration.</p>
      <p class="note">The original app keeps running at this site until the migration completes.</p>
    </ion-content>
  `,
  styles: [`p { color: var(--text-dim); } .note { font-size: 12.5px; color: var(--text-faint); }`]
})
export class PlaceholderPage {
  private route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] ?? 'Quizard';
  readonly milestone = this.route.snapshot.data['milestone'] ?? 'an upcoming milestone';
}
