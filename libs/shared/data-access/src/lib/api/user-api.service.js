import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
/** Manages user profiles and waiter accounts. */
let UserApiService = class UserApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** Get the currently authenticated user's profile. */
    getMe() {
        return this.get(API_CONFIG.endpoints.users.me);
    }
    /** Update the authenticated user's name/email. */
    updateMe(data) {
        return this.put(API_CONFIG.endpoints.users.me, data);
    }
    /** List all waiters for the business. */
    listWaiters() {
        return this.get(API_CONFIG.endpoints.users.waiters);
    }
    /** Create a new waiter account (owner only). */
    createWaiter(data) {
        return this.post(API_CONFIG.endpoints.users.waiters, data);
    }
    /** Reset a staff member's PIN (owner only). */
    resetStaffPin(id, pin) {
        return this.patch(buildUrl(API_CONFIG.endpoints.users.resetPin, { id }), { pin });
    }
    /** Delete a waiter (owner only). */
    deleteWaiter(id) {
        return this.delete(buildUrl(API_CONFIG.endpoints.users.delete, { id }));
    }
};
UserApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], UserApiService);
export { UserApiService };
//# sourceMappingURL=user-api.service.js.map