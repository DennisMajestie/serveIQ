import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors,
  HTTP_INTERCEPTORS,
  withXhr
} from '@angular/common/http';
import { AuthInterceptor } from '@serveiq/shared/data-access';
import { paymentRequiredInterceptor } from './core/payment-required.interceptor';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    // No animations provider on purpose. Nothing here uses the Angular animations
    // API (no @angular/animations import, no @trigger or [@binding] anywhere; all
    // motion is CSS @keyframes or requestAnimationFrame). provideAnimations()
    // still dragged the ~72 kB animation engine into the initial bundle, and
    // provideNoopAnimations() does not help because the
    // @angular/platform-browser/animations barrel itself re-exports the package.
    provideHttpClient(withXhr(), withInterceptorsFromDi(), withInterceptors([paymentRequiredInterceptor])),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: ENVIRONMENT_CONFIG,
      useValue: environment,
    },
  ],
};
