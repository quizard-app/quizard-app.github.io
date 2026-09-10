import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastCtrl = inject(ToastController);

  async toast(message: string, isError = false) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2600,
      position: 'bottom',
      color: isError ? 'danger' : 'dark',
      cssClass: 'qz-toast'
    });
    await t.present();
  }
}
