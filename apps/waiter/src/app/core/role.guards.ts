import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';

export const waiterGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const role = authService.getTokenRole();
  if (role !== 'waiter' && role !== 'supervisor') {
    return router.createUrlTree(['/login']);
  }
  return true;
};