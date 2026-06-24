import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { ENVIRONMENT_CONFIG } from './environment.token';
let AuthService = class AuthService {
    http;
    env;
    tokenSubject = new BehaviorSubject(localStorage.getItem('token'));
    token$ = this.tokenSubject.asObservable();
    constructor(http, env) {
        this.http = http;
        this.env = env;
    }
    get isAuthenticated() {
        return !!localStorage.getItem('token');
    }
    isLoggedIn() {
        return !!localStorage.getItem('token');
    }
    getToken() {
        return localStorage.getItem('token');
    }
    get apiUrl() {
        return this.env.apiUrl;
    }
    login(email, password) {
        return this.http.post(`${this.apiUrl}/api/v1/auth/login`, {
            email, password
        }).pipe(tap(response => {
            const token = response.data?.access_token;
            if (token) {
                localStorage.setItem('token', token);
                const branchId = response.data.branch?.id ||
                    response.data.branchId ||
                    response.data.user?.branch?.id ||
                    response.data.user?.branch;
                const businessId = response.data.business?.id ||
                    response.data.businessId ||
                    response.data.user?.business?.id ||
                    response.data.user?.business;
                if (branchId && branchId !== 'default-branch') {
                    localStorage.setItem('branchId', branchId);
                }
                if (businessId) {
                    localStorage.setItem('businessId', businessId);
                }
                this.tokenSubject.next(token);
            }
        }));
    }
    /** Activate a terminal device using Admin credentials */
    activateTerminal(email, password) {
        return this.http.post(`${this.apiUrl}/api/v1/auth/activate`, { email, password }, { headers: { 'Content-Type': 'application/json' } }).pipe(tap(response => {
            const token = response.data?.access_token;
            // In the new NestJS API, the structure is { success: true, business: {...}, branch: {...}, user: {...} }
            // or for staff login it's { access_token: "...", user: {...} }
            const resData = response.data;
            const businessId = resData.business?.id || resData.businessId || resData.user?.business;
            const businessName = resData.business?.name || resData.businessName || '';
            const branchId = resData.branch?.id || resData.branchId || resData.user?.branch;
            if (businessId)
                localStorage.setItem('businessId', businessId);
            if (businessName)
                localStorage.setItem('businessName', businessName);
            if (branchId && branchId !== 'default-branch')
                localStorage.setItem('branchId', branchId);
            if (token) {
                localStorage.setItem('token', token);
                this.tokenSubject.next(token);
            }
        }));
    }
    /** Verify a staff member's PIN for an activated terminal */
    verifyStaffPin(pin, businessId) {
        return this.http.post(`${this.apiUrl}/api/v1/auth/staff-login`, { pin, businessId }).pipe(tap(response => {
            const token = response.data?.access_token;
            if (token) {
                localStorage.setItem('staffToken', token);
            }
        }));
    }
    register(data) {
        return this.http.post(`${this.apiUrl}/api/v1/auth/register`, data);
    }
    uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/api/v1/upload`, formData);
    }
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('businessId');
        localStorage.removeItem('businessName');
        localStorage.removeItem('staffToken');
        this.tokenSubject.next(null);
    }
};
AuthService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map