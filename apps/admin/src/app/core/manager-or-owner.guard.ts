import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const managerOrOwnerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role = localStorage.getItem('userRole');
  if (role === 'owner' || role === 'manager' || role === 'super_admin') {
    return true;
  }
  return router.parseUrl('/login');
};
