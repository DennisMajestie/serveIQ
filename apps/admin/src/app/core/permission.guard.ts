import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from '@serveiq/shared/data-access';
import { map, of } from 'rxjs';
import { Observable } from 'rxjs';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (): Observable<boolean | UrlTree> => {
    const permService = inject(PermissionService);
    const auth = inject(AuthService);
    const router = inject(Router);

    if (localStorage.getItem('staffToken')) {
      return of(true);
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
