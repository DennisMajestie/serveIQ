import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (): Observable<boolean | UrlTree> => {
    const permService = inject(PermissionService);
    const router = inject(Router);

    return permService.loadPermissions().pipe(
      map(() => {
        if (permService.hasPermission(requiredPermission)) {
          return true;
        }
        return router.createUrlTree(['/login']);
      })
    );
  };
};