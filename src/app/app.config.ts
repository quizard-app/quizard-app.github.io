import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/provide';
import { provideAppInitializer, inject } from '@angular/core';
import { ensureDefaultAccount, setActiveAccount, getAccount } from './core/engine/storage.js';
import { UiStateService } from './core/services/ui-state.service';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

// Capacitor serves the bundled assets locally, so the PWA service worker has
// nothing to cache there — and an old registration would keep serving the
// PREVIOUS APK's JS/CSS after an app update. Register it on the web only.
const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !isNative,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
