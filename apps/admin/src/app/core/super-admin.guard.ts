import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const superAdminGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);
  return permissionService.loadPermissions().pipe(
    map(() => {
      if (permissionService.isSuperAdmin()) {
        return true;
      }
      return router.parseUrl('/app/dashboard');
    })
  );
};