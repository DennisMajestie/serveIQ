import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';
import { ThemePreferenceService } from './theme-preference.service';

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
