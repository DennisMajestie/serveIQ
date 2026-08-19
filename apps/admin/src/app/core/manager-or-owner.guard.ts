import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const managerOrOwnerGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const permService = inject(PermissionService);

  return permService.loadPermissions().pipe(
    map(() => {
      if (permService.isManagerOrOwner() || permService.hasPermission('view_dashboard')) {
        return true;
      }
      return router.parseUrl('/login');
    })
  );
};