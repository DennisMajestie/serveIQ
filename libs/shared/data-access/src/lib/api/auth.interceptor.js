import { __decorate, __metadata } from "tslib";
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
let AuthInterceptor = class AuthInterceptor {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    intercept(request, next) {
        const staffToken = localStorage.getItem('staffToken');
        const token = localStorage.getItem('token');
        // Prioritize staff token for waiter operations, then fallback to admin/terminal token
        const activeToken = staffToken || token;
        if (activeToken) {
            request = request.clone({
                setHeaders: { Authorization: `Bearer ${activeToken}` }
            });
        }
        return next.handle(request).pipe(catchError((error) => {
            if (error.status === 401) {
                this.authService.logout();
            }
            return throwError(() => error);
        }));
    }
};
AuthInterceptor = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthService])
], AuthInterceptor);
export { AuthInterceptor };
//# sourceMappingURL=auth.interceptor.js.map