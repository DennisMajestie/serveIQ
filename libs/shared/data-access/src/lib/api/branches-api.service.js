import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
/** Manages CRUD operations for restaurant branches. */
let BranchesApiService = class BranchesApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** List all branches for the authenticated business. */
    list() {
        return this.get(API_CONFIG.endpoints.branches.list);
    }
    /** Get a single branch by ID. */
    getById(id) {
        return this.get(buildUrl(API_CONFIG.endpoints.branches.get, { id }));
    }
    /** Create a new branch. */
    create(data) {
        return this.post(API_CONFIG.endpoints.branches.create, data);
    }
    /** Update an existing branch. */
    update(id, data) {
        return this.patch(buildUrl(API_CONFIG.endpoints.branches.update, { id }), data);
    }
    /** Get dashboard summary stats (tables, open tabs, orders). */
    getStats() {
        return this.get(API_CONFIG.endpoints.branches.stats);
    }
};
BranchesApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], BranchesApiService);
export { BranchesApiService };
//# sourceMappingURL=branches-api.service.js.map