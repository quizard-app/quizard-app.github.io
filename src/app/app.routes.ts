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
      { path: 'library', loadComponent: () => import('./pages/library/library').then(m => m.LibraryPage) },
      { path: 'history', loadComponent: () => import('./pages/history/history').then(m => m.HistoryPage) },
      { path: 'import', loadComponent: () => import('./pages/import/import').then(m => m.ImportPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsPage) }
    ]
  },
  {
    path: 'doc/:id',
    loadComponent: () => import('./pages/docdetail/docdetail').then(m => m.DocDetailPage)
  },
  {
    path: 'doc/:id/setup',
    loadComponent: () => import('./pages/setup/setup').then(m => m.SetupPage)
  },
  {
    path: 'reviewer/:id',
    loadComponent: () => import('./pages/reviewer/reviewer').then(m => m.ReviewerPage)
  },
  {
    path: 'flashcards/:id',
    loadComponent: () => import('./pages/flashcards/flashcards').then(m => m.FlashcardsPage)
  },
  {
    path: 'quiz',
    loadComponent: () => import('./pages/quiz/quiz').then(m => m.QuizPage)
  },
  {
    path: 'results',
    loadComponent: () => import('./pages/results/results').then(m => m.ResultsPage)
  },
  {
    path: 'exams',
    loadChildren: () => import('./pages/exams/exams.routes').then(m => m.EXAMS_ROUTES)
  },
  {
    path: 'exam-chat',
    loadComponent: () => import('./pages/exam-chat/exam-chat').then(m => m.ExamChatPage)
  },
  { path: '**', redirectTo: 'welcome' }
];
