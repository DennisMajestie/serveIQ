import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal, revealIconsWhenFontReady } from '@serveiq/shared/models';
import { initSentry } from './sentry';

// Both load their heavy dependencies (Sentry, SweetAlert2) via dynamic import,
// so they are deliberately not awaited here: neither is needed to render, and
// awaiting would put them straight back on the critical path.
void initSentry();
void bootstrapSwal();

const savedTheme = localStorage.getItem('serveiq-admin-theme');
document.documentElement.setAttribute('data-theme', savedTheme || 'light');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

revealIconsWhenFontReady();
