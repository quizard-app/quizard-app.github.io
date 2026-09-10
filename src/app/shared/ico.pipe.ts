import { Pipe, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { icon } from './icons.js';

// Renders a Quizard icon SVG (our own static strings) as trusted HTML.
@Pipe({ name: 'ico' })
export class IcoPipe {
  private sanitizer = inject(DomSanitizer);
  private cache = new Map<string, SafeHtml>();

  transform(name: string): SafeHtml {
    if (!this.cache.has(name)) {
      this.cache.set(name, this.sanitizer.bypassSecurityTrustHtml(icon(name)));
    }
    return this.cache.get(name)!;
  }
}
