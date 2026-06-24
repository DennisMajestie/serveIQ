import { __decorate, __metadata } from "tslib";
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './api/auth.service';
let AuthGuard = class AuthGuard {
    authService;
    router;
    constructor(authService, router) {
        this.authService = authService;
        this.router = router;
    }
    canActivate(route, state) {
        if (this.authService.isAuthenticated) {
            return true;
        }
        return this.router.parseUrl('/login');
    }
};
AuthGuard = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __metadata("design:paramtypes", [AuthService, Router])
], AuthGuard);
export { AuthGuard };
//# sourceMappingURL=auth.guard.js.map