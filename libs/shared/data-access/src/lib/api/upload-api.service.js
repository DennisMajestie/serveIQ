import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { ENVIRONMENT_CONFIG } from './environment.token';
let UploadApiService = class UploadApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        // Do NOT set Content-Type header — browser sets multipart/form-data with boundary automatically
        const fullUrl = `${this.apiUrl}/api/v1/upload`;
        return this.http.post(fullUrl, formData);
    }
};
UploadApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], UploadApiService);
export { UploadApiService };
// Alias for backward compatibility during migration
export const UploadService = UploadApiService;
//# sourceMappingURL=upload-api.service.js.map