import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserApiService } from '@serveiq/shared/data-access';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const ownerGuard = () => {
  const userApi = inject(UserApiService);
  const router = inject(Router);

  return userApi.getMe().pipe(
    map(user => {
      let role: string = user.role;
      if (role === 'superadmin') role = 'super_admin';
      localStorage.setItem('userRole', role);
      if (role === 'owner' || role === 'super_admin') {
        return true;
      }
      return router.createUrlTree(['/app/supervisor/orders']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
