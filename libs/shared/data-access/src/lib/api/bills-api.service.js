import { __decorate, __metadata, __param } from "tslib";
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG } from './environment.token';
/** Manages bill generation, payment recording and receipts. */
let BillsApiService = class BillsApiService extends BaseApiService {
    constructor(http, env) {
        super(http, env);
    }
    /** Generate (or re-generate) a bill for a tab. */
    generate(tabId, options = {}) {
        return this.post(buildUrl(API_CONFIG.endpoints.bills.generate, { tabId }), options);
    }
    /** Record a payment against a bill, closing the tab. */
    recordPayment(tabId, payment) {
        return this.post(buildUrl(API_CONFIG.endpoints.bills.pay, { tabId }), payment);
    }
    /** Fetch the paid receipt for a tab. */
    getReceipt(tabId) {
        return this.get(buildUrl(API_CONFIG.endpoints.bills.receipt, { tabId }));
    }
    /** Fetch the bill for a given tab (via receipt endpoint). */
    getByTab(tabId) {
        return new Observable(obs => {
            this.getReceipt(tabId).subscribe({
                next: (r) => { obs.next(r.bill); obs.complete(); },
                error: (e) => obs.error(e)
            });
        });
    }
};
BillsApiService = __decorate([
    Injectable({ providedIn: 'root' }),
    __param(1, Inject(ENVIRONMENT_CONFIG)),
    __metadata("design:paramtypes", [HttpClient, Object])
], BillsApiService);
export { BillsApiService };
//# sourceMappingURL=bills-api.service.js.map