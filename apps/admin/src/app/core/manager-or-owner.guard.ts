import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

export const managerOrOwnerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const permService = inject(PermissionService);

  if (permService.permissionsLoaded()) {
    if (permService.hasPermission('view_dashboard')) {
      return true;
    }
    // Legacy fallback: user has no role_id but has legacy role string
    const role = localStorage.getItem('userRole');
    if (role === 'owner' || role === 'manager' || role === 'super_admin') {
      return true;
    }
    return router.parseUrl('/login');
  }

  const role = localStorage.getItem('userRole');
  if (role === 'owner' || role === 'manager' || role === 'super_admin') {
    return true;
  }

  permService.loadPermissions();
  return router.parseUrl('/login');
};
