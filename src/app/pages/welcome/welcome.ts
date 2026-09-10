import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { assetUrl } from '../../shared/assets.js';

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
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.timer = setTimeout(() => this.advance(), 2050);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  advance() {
    if (this.exiting) return;
    this.exiting = true;
    if (this.timer) clearTimeout(this.timer);
    // play the "poof" exit before handing over (accounts/onboarding next)
    setTimeout(() => this.router.navigateByUrl('/onboarding'), 430);
  }
}
