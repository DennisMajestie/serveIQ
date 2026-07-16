import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import { ThemePreferenceService } from './theme-preference.service';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Redirects supervisors/admins to the admin app.
 * Also pre-caches the user's theme preference for canMatch guards.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const themePref = inject(ThemePreferenceService);
  const env = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  const role = localStorage.getItem('userRole');
  if (role === 'supervisor' || role === 'super_admin') {
    const adminUrl = env.publicMenuBaseUrl.replace(/\/+$/, '');
    window.location.assign(adminUrl + (role === 'supervisor' ? '/app/supervisor/orders' : '/app/admin/dashboard'));
    return false;
  }

  themePref.refreshFromApi().subscribe();
  return true;
};
