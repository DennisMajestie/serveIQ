import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const waiterGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  if (role !== 'waiter' && role !== 'supervisor') {
    return router.createUrlTree(['/login']);
  }
  return true;
};
