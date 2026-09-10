import { Injectable, signal } from '@angular/core';
import type { Account } from '../engine/db-types.js';

// Session UI state — the Angular equivalent of the vanilla app's ctx.state.
@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly account = signal<Account | null>(null);
  readonly theme = signal<'dark' | 'light'>(
    (typeof localStorage !== 'undefined' && (() => {
      try {
        const s = JSON.parse(localStorage.getItem('quizard-settings') || '{}');
        return s['theme'] === 'light' ? 'light' : 'dark';
      } catch { return 'dark'; }
    })()) as 'dark' | 'light'
  );

  setTheme(theme: 'dark' | 'light') {
    this.theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    try {
      const s = JSON.parse(localStorage.getItem('quizard-settings') || '{}');
      s['theme'] = theme;
      localStorage.setItem('quizard-settings', JSON.stringify(s));
    } catch { /* ignore */ }
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }
}
