import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const permService = inject(PermissionService);
    const router = inject(Router);

    if (!permService.permissionsLoaded()) {
      permService.loadPermissions();
    }

    if (permService.hasPermission(requiredPermission)) {
      return true;
    }

    return router.parseUrl('/app/dashboard');
  };
};
