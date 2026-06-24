import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
let TabsApiService = class TabsApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    // Get all tabs
    getAllTabs() {
        return this.get(API_CONFIG.endpoints.tabs.list);
    }
    // Get a single tab
    getTab(id) {
        return this.get(API_CONFIG.endpoints.tabs.get, { id });
    }
    // Open a new tab (create)
    createTab(tab) {
        return this.post(API_CONFIG.endpoints.tabs.open, tab);
    }
    // Update a tab (uses close endpoint with partial payload)
    updateTab(id, updates) {
        return this.patch(buildUrl(API_CONFIG.endpoints.tabs.close, { id }), updates);
    }
    // Close a tab
    closeTab(id) {
        return this.post(API_CONFIG.endpoints.tabs.close, { id });
    }
};
TabsApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], TabsApiService);
export { TabsApiService };
//# sourceMappingURL=tabs-api.service.js.map