import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { assetUrl } from '../../shared/assets.js';
import { listAccounts, loadSettings, setActiveAccount } from '../../core/engine/storage.js';

const SPARKS = Array.from({ length: 10 }, (_, i) =>
  ({ a: `${i * 36}deg`, d: `${(0.45 + i * 0.045).toFixed(2)}s` })
);

const DUST = [
  { l: '16%', t: '24%', d: '0s' },   { l: '82%', t: '18%', d: '.5s' },
  { l: '70%', t: '64%', d: '1s' },   { l: '24%', t: '70%', d: '1.4s' },
  { l: '10%', t: '48%', d: '.8s' },  { l: '88%', t: '46%', d: '1.8s' },
  { l: '40%', t: '14%', d: '1.1s' }, { l: '58%', t: '82%', d: '.3s' }
];

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  host: { '(click)': 'advance()' }
})
export class WelcomePage implements OnInit, OnDestroy {
  readonly sparks = SPARKS;
  readonly dust = DUST;
  readonly heroUrl = assetUrl('wizard/wizard-welcome.jpg');
  exiting = false;
  // Where the splash hands over: returning students land on the profile
  // picker (PIN enforcement + sync-code restore live there); fresh devices
  // play the slides and create their first profile.
  private launchTo: '/accounts' | '/onboarding' = '/onboarding';
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.decideLaunch().then(target => {
      if (target !== '/onboarding') {
        // picker (returning) or straight-into-the-app (skip intro): no splash
        this.exiting = true;
        this.router.navigateByUrl(target);
        return;
      }
      this.timer = setTimeout(() => this.advance(), 2050);
    });
  }

  private async decideLaunch(): Promise<'/accounts' | '/onboarding' | '/tabs/library'> {
    try {
      const accounts = await listAccounts();
      const fresh = !accounts.length || (accounts.length === 1 && accounts[0].name === 'My account');
      if (fresh) return '/onboarding';
      // "Skip intro on launch": straight into the app with the last profile —
      // but a PIN-protected profile still goes through the picker gate.
      if (loadSettings().skipIntro) {
        const lastId = localStorage.getItem('quizard-active-account') || '';
        const last = lastId ? accounts.find(a => a.id === lastId) : null;
        if (last && !last.pinHash) {
          setActiveAccount(last.id);
          return '/tabs/library';
        }
      }
      return '/accounts';
    } catch {
      return '/onboarding';
    }
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  advance() {
    if (this.exiting) return;
    this.exiting = true;
    if (this.timer) clearTimeout(this.timer);
    // play the "poof" exit before handing over
    setTimeout(() => this.router.navigateByUrl(this.launchTo), 430);
  }
}
