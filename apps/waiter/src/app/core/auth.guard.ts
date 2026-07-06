import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';
import { ThemePreferenceService } from './theme-preference.service';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Also pre-caches the user's theme preference for canMatch guards.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const themePref = inject(ThemePreferenceService);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  themePref.refreshFromApi().subscribe();
  return true;
};
