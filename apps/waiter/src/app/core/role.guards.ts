import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const supervisorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  if (role !== 'supervisor') {
    return router.createUrlTree(['/tables']);
  }
  return true;
};
