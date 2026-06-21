import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Uses the shared AuthService token check.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = auth.isLoggedIn();
  console.log('[AuthGuard] Checking authentication status:', isAuthenticated);
  console.log('[AuthGuard] Token in localStorage (token):', !!localStorage.getItem('token'));

  if (isAuthenticated) {
    console.log('[AuthGuard] Access granted');
    return true;
  }

  console.warn('[AuthGuard] Access denied - redirecting to /login');
  return router.createUrlTree(['/login']);
};
