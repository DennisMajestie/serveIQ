import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from "../../../../../libs/shared/data-access/src/index.ts";
/**
 * Route guard that redirects unauthenticated users to /login.
 * Uses the shared AuthService token check.
 */
export const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const isAuthenticated = auth.isLoggedIn();
    console.log('[AuthGuard] Checking authentication status:', isAuthenticated);
    console.log('[AuthGuard] Token in localStorage (token):', !!localStorage.getItem('token'));
    if (isAuthenticated) {
        console.log('[AuthGuard] Access granted');
        return true;
    }
    console.warn('[AuthGuard] Access denied - redirecting to /login');
    return router.createUrlTree(['/login']);
};
//# sourceMappingURL=auth.guard.js.map