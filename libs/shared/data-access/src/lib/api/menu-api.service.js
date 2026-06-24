import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
let MenuApiService = class MenuApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** Get all menu items. */
    getAllItems() {
        return this.get(API_CONFIG.endpoints.menu.list);
    }
    /** Get a single menu item by ID. */
    getMenuItem(id) {
        return this.get(buildUrl(API_CONFIG.endpoints.menu.get, { id }));
    }
    /** Create a new menu item. */
    createItem(data) {
        return this.post(API_CONFIG.endpoints.menu.create, data);
    }
    /** Update an existing menu item (availability, price, etc.). */
    updateItem(id, data) {
        return this.patch(buildUrl(API_CONFIG.endpoints.menu.update, { id }), data);
    }
    /** Delete a menu item permanently. */
    deleteItem(id) {
        return this.delete(buildUrl(API_CONFIG.endpoints.menu.delete, { id }));
    }
};
MenuApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], MenuApiService);
export { MenuApiService };
//# sourceMappingURL=menu-api.service.js.map