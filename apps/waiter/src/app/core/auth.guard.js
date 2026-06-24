import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from "../../../../../libs/shared/data-access/src/index.ts";
/**
 * Route guard that redirects unauthenticated users to /login.
 */
export const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.isAuthenticated ? true : router.createUrlTree(['/login']);
};
//# sourceMappingURL=auth.guard.js.map