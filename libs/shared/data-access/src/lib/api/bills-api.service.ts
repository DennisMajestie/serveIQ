import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Bill, Receipt, GenerateBillRequest, RecordPaymentRequest, ApplyDiscountRequest } from '@serveiq/shared/models';
import { snakeToCamel } from '@serveiq/shared/models';

/** Manages bill generation, payment recording and receipts. */
@Injectable({ providedIn: 'root' })
export class BillsApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Generate (or re-generate) a bill for a tab. */
  generate(tabId: string, options: GenerateBillRequest = {}): Observable<Bill> {
    return this.post<Bill>(buildUrl(API_CONFIG.endpoints.bills.generate, { tabId }), options);
  }

  /** Apply a discount to a pending bill. */
  applyDiscount(tabId: string, discount: ApplyDiscountRequest): Observable<Bill> {
    return this.post<Bill>(buildUrl(API_CONFIG.endpoints.bills.applyDiscount, { tabId }), discount);
  }

  /** Record a payment against a bill, closing the tab. */
  recordPayment(tabId: string, payment: RecordPaymentRequest): Observable<Bill> {
    return this.post<Bill>(buildUrl(API_CONFIG.endpoints.bills.pay, { tabId }), payment);
  }

  /** Fetch the paid receipt for a tab. */
  getReceipt(tabId: string): Observable<Receipt> {
    return this.get<Receipt>(buildUrl(API_CONFIG.endpoints.bills.receipt, { tabId }));
  }

  /** Fetch the bill for a given tab (via receipt endpoint). Returns null if no bill exists. */
  getByTab(tabId: string): Observable<Bill | null> {
    const url = `${this.apiUrl}${buildUrl(API_CONFIG.endpoints.bills.receipt, { tabId })}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          data = data.data;
        }
        return snakeToCamel<Receipt>(data);
      }),
      map(r => r.bill),
      catchError(() => of(null))
    );
  }
}
