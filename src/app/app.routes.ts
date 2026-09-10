import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'welcome' },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome').then(m => m.WelcomePage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding').then(m => m.OnboardingPage)
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/accounts').then(m => m.AccountsPage)
  },
  {
    path: 'tutorial',
    loadComponent: () => import('./pages/tutorial/tutorial').then(m => m.TutorialPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs').then(m => m.TabsPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'library' },
      { path: 'library', loadComponent: () => import('./pages/placeholder/placeholder').then(m => m.PlaceholderPage), data: { title: 'Library', milestone: 'M1' } },
      { path: 'history', loadComponent: () => import('./pages/placeholder/placeholder').then(m => m.PlaceholderPage), data: { title: 'Progress', milestone: 'M2' } },
      { path: 'import', loadComponent: () => import('./pages/placeholder/placeholder').then(m => m.PlaceholderPage), data: { title: 'Add document', milestone: 'M1' } },
      { path: 'settings', loadComponent: () => import('./pages/placeholder/placeholder').then(m => m.PlaceholderPage), data: { title: 'Settings', milestone: 'M2' } }
    ]
  },
  { path: '**', redirectTo: 'welcome' }
];
