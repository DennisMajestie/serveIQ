import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role = localStorage.getItem('userRole');
  if (role === 'super_admin') {
    return true;
  }
  return router.parseUrl('/app/dashboard');
};
