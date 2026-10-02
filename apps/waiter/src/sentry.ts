import { environment } from './environments/environment';

/**
 * Sentry is loaded on demand rather than statically imported. It is ~105 kB of
 * SDK that used to sit in the initial bundle on every app start, even though
 * `sentryDsn` is empty in the production environment and the init was a no-op.
 * The dynamic import keeps the SDK out of the initial graph and means it is
 * only ever fetched when a DSN is actually configured.
 */
export async function initSentry(): Promise<void> {
  if (!environment.sentryDsn) return;
  const Sentry = await import('@sentry/browser');
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
  });
}