import { Capacitor } from '@capacitor/core';

// The docs site is published from its own repository at /quizard-docs/.
// Local preview still serves the source folder at /site/; the APK has no
// bundled copy, so native opens the published site in the browser.
const local = /^localhost$|^127(\.\d+){3}$/.test(globalThis.location?.hostname || '');

export const DOCS_URL = Capacitor.isNativePlatform()
  ? 'https://quizard-app.github.io/quizard-docs/'
  : local ? '/site/' : '/quizard-docs/';
