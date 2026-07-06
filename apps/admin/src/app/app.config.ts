import {
  ApplicationConfig,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';
import { ChunkErrorHandler } from './core/chunk-error-handler.class';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
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