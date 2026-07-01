import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

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
