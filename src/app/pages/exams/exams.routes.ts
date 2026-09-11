import { Routes } from '@angular/router';

export const EXAMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./exams').then(m => m.ExamsPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./exams').then(m => m.ExamsPage)
  }
];
