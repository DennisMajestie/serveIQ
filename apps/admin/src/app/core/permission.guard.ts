import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (): Observable<boolean | UrlTree> => {
    const permService = inject(PermissionService);
    const router = inject(Router);
    const role = localStorage.getItem('userRole');

    if (role === 'superadmin' || role === 'super_admin' || role === 'owner') {
      return new Observable(sub => {
        sub.next(true);
        sub.complete();
      });
    }

    return permService.loadPermissions().pipe(
      map(() => {
        if (permService.hasPermission(requiredPermission)) {
          return true;
        }
        return router.parseUrl('/login');
      })
    );
  };
};
