import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withXhr } from '@angular/common/http';
import { ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    { provide: ENVIRONMENT_CONFIG, useValue: environment },
  ],
};
