import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { getClass } from '../../core/engine/storage.js';
import { IcoPipe } from '../../shared/ico.pipe';

// Full-page class roster (replaces the old viewer modal): back header, class
// summary and the numbered student list, with a hand-off to the edit sheet on
// the Classes tab via ?edit=<id>.
@Component({
  selector: 'app-class-roster',
  imports: [IonContent, IcoPipe],
  templateUrl: './class-roster.html',
})
export class ClassRosterPage {
  router = inject(Router);
  private route = inject(ActivatedRoute);

  cls = signal<any>(null);
  missing = signal(false);

  readonly students = computed(() =>
    (this.cls()?.students || []).slice().sort((a: any, b: any) => (a.no || 0) - (b.no || 0)));

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    const cls = id ? await getClass(id) : null;
    this.cls.set(cls);
    this.missing.set(!cls);
  }

  edit() {
    if (this.cls()) this.router.navigateByUrl('/tabs/classes?edit=' + this.cls().id);
  }
}
