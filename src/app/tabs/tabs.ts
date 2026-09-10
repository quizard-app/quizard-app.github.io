import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookOutline, statsChartOutline, addOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.html',
})
export class TabsPage {
  constructor() {
    addIcons({ bookOutline, statsChartOutline, addOutline, settingsOutline });
  }
}
