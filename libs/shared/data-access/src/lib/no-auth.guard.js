import { __decorate, __metadata } from "tslib";
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './api/auth.service';
let NoAuthGuard = class NoAuthGuard {
    authService;
    router;
    constructor(authService, router) {
        this.authService = authService;
        this.router = router;
    }
    canActivate(route, state) {
        if (!this.authService.isAuthenticated) {
            return true;
        }
        return this.router.parseUrl('/');
    }
};
NoAuthGuard = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __metadata("design:paramtypes", [AuthService, Router])
], NoAuthGuard);
export { NoAuthGuard };
//# sourceMappingURL=no-auth.guard.js.map