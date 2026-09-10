import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private alertCtrl = inject(AlertController);

  async confirm(title: string, message: string, okLabel = 'Delete'): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: title,
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: okLabel, role: 'destructive' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'destructive';
  }
}
