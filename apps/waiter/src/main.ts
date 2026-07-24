import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal } from '@serveiq/shared/models';
import { initSentry } from './sentry';

initSentry();

bootstrapSwal();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
