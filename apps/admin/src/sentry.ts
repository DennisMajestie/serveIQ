import * as Sentry from '@sentry/browser';
import { environment } from './environments/environment';

export function initSentry() {
  if (environment.sentryDsn) {
    Sentry.init({
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
    });
  }
}
