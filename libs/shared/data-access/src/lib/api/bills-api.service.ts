import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Bill, Receipt, GenerateBillRequest, RecordPaymentRequest } from '@serveiq/shared/models';

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
    return this.getReceipt(tabId).pipe(
      map(r => r.bill),
      catchError(() => of(null))
    );
  }
}
