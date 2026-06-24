import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { buildUrl } from './api.config';
import { handleApiError } from './api-error';
import { ENVIRONMENT_CONFIG } from './environment.token';
let BaseApiService = class BaseApiService {
    http;
    env;
    defaultHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
    });
    constructor(http, env) {
        this.http = http;
        this.env = env;
    }
    get apiUrl() {
        return this.env.apiUrl;
    }
    // GET Request
    get(url, params) {
        const fullUrl = this.buildFullUrl(url, params);
        return this.http
            .get(fullUrl, { headers: this.defaultHeaders })
            .pipe(map(res => res && typeof res === 'object' && 'data' in res ? res.data : res), catchError(handleApiError));
    }
    // POST Request
    post(url, body) {
        const fullUrl = this.buildFullUrl(url);
        return this.http
            .post(fullUrl, body, { headers: this.defaultHeaders })
            .pipe(map(res => res && typeof res === 'object' && 'data' in res ? res.data : res), catchError(handleApiError));
    }
    // PUT Request
    put(url, body) {
        const fullUrl = this.buildFullUrl(url);
        return this.http
            .put(fullUrl, body, { headers: this.defaultHeaders })
            .pipe(map(res => res && typeof res === 'object' && 'data' in res ? res.data : res), catchError(handleApiError));
    }
    // PATCH Request
    patch(url, body) {
        const fullUrl = this.buildFullUrl(url);
        return this.http
            .patch(fullUrl, body, { headers: this.defaultHeaders })
            .pipe(map(res => res && typeof res === 'object' && 'data' in res ? res.data : res), catchError(handleApiError));
    }
    // DELETE Request
    delete(url) {
        const fullUrl = this.buildFullUrl(url);
        return this.http
            .delete(fullUrl, { headers: this.defaultHeaders })
            .pipe(catchError(handleApiError));
    }
    // Helper: Build full URL
    buildFullUrl(urlTemplate, params) {
        const path = buildUrl(urlTemplate, params || {});
        return `${this.apiUrl}${path}`;
    }
};
BaseApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], BaseApiService);
export { BaseApiService };
//# sourceMappingURL=base-api.service.js.map