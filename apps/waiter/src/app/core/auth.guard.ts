import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import { ThemePreferenceService } from './theme-preference.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const themePref = inject(ThemePreferenceService);
  const env = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  const role = localStorage.getItem('userRole');
  if (role === 'supervisor') {
    window.location.assign(env.publicMenuBaseUrl.replace(/\/+$/, '') + '/login');
    return false;
  }
  if (role === 'super_admin') {
    window.location.assign(env.publicMenuBaseUrl.replace(/\/+$/, '') + '/app/admin/dashboard');
    return false;
  }

  themePref.refreshFromApi().subscribe();
  return true;
};
