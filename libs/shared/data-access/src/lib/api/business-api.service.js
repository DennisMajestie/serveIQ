import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
/** Manages the authenticated owner's business profile. */
let BusinessApiService = class BusinessApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** Get the business profile. */
    getBusiness() {
        return this.get(API_CONFIG.endpoints.business.get);
    }
    /** Update business name or type. */
    updateBusiness(data) {
        return this.put(API_CONFIG.endpoints.business.update, data);
    }
};
BusinessApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], BusinessApiService);
export { BusinessApiService };
//# sourceMappingURL=business-api.service.js.map