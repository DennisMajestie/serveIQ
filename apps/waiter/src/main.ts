import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal } from '@serveiq/shared/models';
import { initSentry } from './sentry';
import { environment } from './environments/environment';

// Both load their heavy dependencies (Sentry, SweetAlert2) via dynamic import,
// so they are deliberately not awaited here: neither is needed to render, and
// awaiting would put them straight back on the critical path.
void initSentry();
void bootstrapSwal();

// Only register the offline service worker in production builds.
// The dev server (Vite) HMR relies on runtime virtual modules (`@ng/component`)
// that a caching service worker intercepts and breaks (net::ERR_FAILED).
if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
