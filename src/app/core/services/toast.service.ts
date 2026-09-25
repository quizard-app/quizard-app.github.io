import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

export interface ToastAction {
  text: string;
  handler: () => void | Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastCtrl = inject(ToastController);

  async toast(message: string, isError = false, action?: ToastAction) {
    const t = await this.toastCtrl.create({
      message,
      duration: action ? 7000 : 2600,
      // Top placement: bottom toasts covered the tab bar on every screen.
      position: 'top',
      color: isError ? 'danger' : 'dark',
      cssClass: action ? 'qz-toast qz-toast-action' : 'qz-toast',
      buttons: action ? [{
        text: action.text,
        role: 'action',
        handler: () => { void action.handler(); }
      }] : undefined
    });
    await t.present();
  }
}
