import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
/** Manages order items within a tab. */
let OrdersApiService = class OrdersApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** Get all order items for a tab. */
    getByTab(tabId) {
        return this.get(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }));
    }
    /** Add items to a tab. */
    addItems(tabId, items) {
        return this.post(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }), items);
    }
    /** Update a single order item (quantity / notes). */
    updateItem(id, updates) {
        return this.put(buildUrl(API_CONFIG.endpoints.orders.update, { id }), updates);
    }
    /** Remove a single order item. */
    deleteItem(id) {
        return this.delete(buildUrl(API_CONFIG.endpoints.orders.delete, { id }));
    }
};
OrdersApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], OrdersApiService);
export { OrdersApiService };
//# sourceMappingURL=orders-api.service.js.map