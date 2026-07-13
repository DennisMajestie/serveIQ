import {
  ApplicationConfig,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { AuthInterceptor, ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { ChunkErrorHandler } from './core/chunk-error-handler.class';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: ENVIRONMENT_CONFIG,
      useValue: environment,
    },
    {
      provide: ErrorHandler,
      useClass: ChunkErrorHandler,
    },
  ],
};