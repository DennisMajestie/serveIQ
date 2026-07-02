import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { bootstrapSwal } from '@serveiq/shared/models';

bootstrapSwal();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
