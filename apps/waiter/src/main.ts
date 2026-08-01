import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal } from '@serveiq/shared/models';
import { initSentry } from './sentry';
import { environment } from './environments/environment';

initSentry();

bootstrapSwal();

// Only register the offline service worker in production builds.
// The dev server (Vite) HMR relies on runtime virtual modules (`@ng/component`)
// that a caching service worker intercepts and breaks (net::ERR_FAILED).
if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
