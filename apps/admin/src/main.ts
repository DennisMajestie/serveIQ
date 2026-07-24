import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal } from '@serveiq/shared/models';
import { initSentry } from './sentry';

initSentry();

bootstrapSwal();

const savedTheme = localStorage.getItem('serveiq-admin-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', savedTheme || (prefersDark ? 'dark' : 'light'));

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Font loading detection — prevent FOUC of icon text
if ('fonts' in document) {
  Promise.allSettled([
    document.fonts.load('24px "Material Icons"'),
    document.fonts.load('24px "Material Symbols Outlined"'),
  ]).then(() => {
    document.body.classList.add('fonts-loaded');
  });
}
