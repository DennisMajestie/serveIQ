import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserApiService } from '@serveiq/shared/data-access';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const superAdminGuard: CanActivateFn = () => {
  const userApi = inject(UserApiService);
  const router = inject(Router);

  return userApi.getMe().pipe(
    map(user => {
      let role: string = user.role;
      if (role === 'superadmin') role = 'super_admin';
      if (role === 'super_admin') {
        localStorage.setItem('userRole', 'super_admin');
        return true;
      }
      localStorage.setItem('userRole', role);
      return router.createUrlTree(['/app/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
