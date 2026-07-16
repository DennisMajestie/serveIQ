import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const ownerGuard = () => {
  const router = inject(Router);
  const role = localStorage.getItem('userRole');
  if (role === 'owner' || role === 'super_admin') {
    return true;
  }
  return router.parseUrl('/login');
};
