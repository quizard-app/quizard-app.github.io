import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ShareModalComponent } from './shared/share-modal.component';
import { IdlePreloadService } from './core/services/idle-preload.service';
import { afterNextRender } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, ShareModalComponent],
  templateUrl: './app.html',
})
export class App {
  // inject() runs here, inside the component's injection context — calling it
  // inside the afterNextRender callback instead throws NG0203.
  private preload = inject(IdlePreloadService);
  private router = inject(Router);

  constructor() {
    // An inbound share/challenge link (#quiz=…) takes priority — the
    // recipient plays without onboarding or an account (legacy bootFlow).
    // Synchronous in the constructor so it wins over the welcome splash's
    // timed redirect to /onboarding. The token is re-attached as the
    // fragment because navigateByUrl would otherwise drop location.hash
    // before SharedPage can read it.
    if (typeof location !== 'undefined') {
      const m = location.hash.match(/quiz=([^&]+)/);
      if (m) void this.router.navigate(['/shared'], { fragment: 'quiz=' + m[1] });
    }
    afterNextRender(() => this.preload.start());
  }
}
