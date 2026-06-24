import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
let TablesApiService = class TablesApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    // Get all tables
    getAllTables() {
        return this.get(API_CONFIG.endpoints.tables.list);
    }
    // Get a single table
    getTable(id) {
        return this.get(API_CONFIG.endpoints.tables.get, { id });
    }
    // Create a table
    createTable(table) {
        return this.post(API_CONFIG.endpoints.tables.create, table);
    }
    // Update a table
    updateTable(id, updates) {
        return this.put(API_CONFIG.endpoints.tables.update, { id, ...updates });
    }
    // Update table status
    updateTableStatus(id, status) {
        return this.updateTable(id, { status });
    }
};
TablesApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], TablesApiService);
export { TablesApiService };
//# sourceMappingURL=tables-api.service.js.map