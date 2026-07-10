import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserApiService } from '@serveiq/shared/data-access';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const superAdminGuard: CanActivateFn = () => {
  const userApi = inject(UserApiService);
  const router = inject(Router);

  // Fast path: check localStorage role (set on login by auth.service)
  const cachedRole = localStorage.getItem('userRole');
  if (cachedRole === 'super_admin') {
    return true;
  }
  if (cachedRole && cachedRole !== 'super_admin') {
    return of(router.createUrlTree(['/app/dashboard']));
  }

  // Authoritative check: verify role via API (fallback when nothing cached)
  return userApi.getMe().pipe(
    map(user => {
      let role: string = user.role;
      if (role === 'superadmin') role = 'super_admin';
      if (role === 'super_admin') {
        localStorage.setItem('userRole', 'super_admin');
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/app/dashboard'])))
  );
};
