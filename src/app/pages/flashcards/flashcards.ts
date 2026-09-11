import { Component, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { getDoc, srsIdFor, getSrsItem, upsertSrsFromMistake, gradeSrsItem, bankMistake } from '../../core/engine/storage.js';
import { buildDeck } from '../../core/engine/flashcards.js';
import { icon } from '../../shared/icons.js';
import { IcoPipe } from '../../shared/ico.pipe';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-flashcards',
  imports: [IonContent, IcoPipe],
  templateUrl: './flashcards.html',
})
export class FlashcardsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  doc = signal<any>(null);
  tooFew = signal(false);
  done = signal(false);
  deck: any[] = [];
  againPile: any[] = [];
  index = 0;
  flipped = false;
  icons = { sparkles: icon('sparkles'), trophy: icon('trophy'), refresh: icon('refresh'), x: icon('x'), check: icon('check') };

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const doc = await getDoc(id);
    if (!doc) { this.router.navigateByUrl('/tabs/library'); return; }
    this.doc.set(doc);
    const deck = buildDeck(doc, []);
    if (deck.length < 3) { this.tooFew.set(true); return; }
    this.deck = deck;
  }

  ngOnDestroy() { /* key listener is window-scoped but checks doc presence */ }

  get currentCard() {
    return this.index < this.deck.length ? this.deck[this.index] : this.againPile[0];
  }
  get totalCount() { return this.deck.length + this.againPile.length; }
  get progressPct() { return this.totalCount ? (this.index / this.totalCount) * 100 : 0; }
  get progressLabel() { return `${Math.min(this.index + 1, this.totalCount)}/${this.totalCount}`; }

  flip() { this.flipped = !this.flipped; }

  async advance(knewIt: boolean) {
    const card = this.currentCard;
    if (!card) return;
    try {
      const id = srsIdFor(this.doc().id, card.term, card.back);
      if (!(await getSrsItem(id))) {
        await upsertSrsFromMistake({ docId: this.doc().id, sentence: card.back, term: card.term, type: 'id' });
      }
      await gradeSrsItem(id, knewIt ? 'good' : 'again');
      if (!knewIt) await bankMistake({ docId: this.doc().id, sentence: card.back, term: card.term, type: 'id' }).catch(() => {});
    } catch { /* best-effort */ }
    if (knewIt) this.index++;
    else { this.againPile.push(card); this.index++; }
    this.flipped = false;
    if (this.index >= this.deck.length) {
      if (this.againPile.length) this.deck.push(...this.againPile.splice(0));
      else { this.done.set(true); return; }
    }
  }

  restart() { this.index = 0; this.againPile = []; this.done.set(false); this.flipped = false; }
  backToDoc() { this.router.navigate(['/doc', this.doc().id]); }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.tooFew() || this.done()) return;
    if (e.key === ' ') { e.preventDefault(); this.flip(); }
    if (e.key === 'ArrowRight') this.advance(true);
    if (e.key === 'ArrowLeft') this.advance(false);
  }
}
