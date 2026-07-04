import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserApiService } from '@serveiq/shared/data-access';
import { map } from 'rxjs/operators';

export const superAdminGuard: CanActivateFn = () => {
  const userApi = inject(UserApiService);
  const router = inject(Router);
  return userApi.getMe().pipe(
    map(user => {
      if (user.role === 'super_admin') {
        return true;
      }
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};
