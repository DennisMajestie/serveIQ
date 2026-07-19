import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const managerOrOwnerGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const permService = inject(PermissionService);

  const legacyRoleOk = () => {
    const role = localStorage.getItem('userRole');
    return role === 'owner' || role === 'manager' || role === 'super_admin';
  };

  if (permService.permissionsLoaded()) {
    if (permService.hasPermission('view_dashboard') || legacyRoleOk()) {
      return new Observable(sub => { sub.next(true); sub.complete(); });
    }
    return new Observable(sub => { sub.next(router.parseUrl('/login')); sub.complete(); });
  }

  if (legacyRoleOk()) {
    return new Observable(sub => { sub.next(true); sub.complete(); });
  }

  return permService.loadPermissions().pipe(
    map(() => {
      if (permService.hasPermission('view_dashboard') || legacyRoleOk()) {
        return true;
      }
      return router.parseUrl('/login');
    })
  );
};
