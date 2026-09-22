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
      // Inline SVGs with only a viewBox stretch to their container's width
      // wherever no CSS sizes them (e.g. icons inside labels) — give every
      // icon an intrinsic 1em size; explicit CSS rules still override it.
      const svg = icon(name).replace('<svg ', '<svg width="1em" height="1em" ');
      this.cache.set(name, this.sanitizer.bypassSecurityTrustHtml(svg));
    }
    return this.cache.get(name)!;
  }
}
