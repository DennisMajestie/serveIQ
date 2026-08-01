import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Only register the offline service worker in production builds.
// The dev server (Vite) HMR relies on runtime virtual modules that a
// caching service worker intercepts and breaks (net::ERR_FAILED).
if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
