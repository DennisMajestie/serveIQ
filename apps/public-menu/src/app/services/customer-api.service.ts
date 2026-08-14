import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { snakeToCamel } from '@serveiq/shared/models';
import { ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';

export interface OpenTabResponse {
  id: string;
  tableId: string;
  status: string;
  customerName: string;
  partySize: number;
  tabType: string;
  trackingCode: string;
  trackingGeneratedAt: string;
  openedAt: string;
  totalKobo: number;
  orders: any[];
}

export interface PlaceOrderResponse {
  tabId: string;
  trackingCode: string;
  orders: { id: string; menuItemId: string; quantity: number; subtotalKobo: number; orderStatus: string }[];
}

export interface PaymentMethod {
  type: 'terminal' | 'pos' | 'transfer' | 'cash';
  id?: string;
  label?: string;
  accountNumber?: string;
  hasTransfer?: boolean;
  autoConfirm?: boolean;
  provider?: string;
  terminals?: { id: string; label: string }[];
}

export interface PaymentInitResponse {
  billId: string;
  tabId: string;
  amountKobo: number;
  amountFormatted: string;
  paymentReference?: string;
  paymentMethods: PaymentMethod[];
}

export interface PaymentStatusResponse {
  tabId: string;
  tabStatus: string;
  paymentStatus: string;
  paidAt: string | null;
}

export interface TabStatusResponse {
  id: string;
  tableId: string;
  status: string;
  customerName: string;
  partySize: number;
  tabType: string;
  trackingCode: string;
  trackingGeneratedAt: string;
  openedAt: string;
  totalKobo: number;
  orders: {
    id: string;
    menuItemId: string;
    quantity: number;
    subtotalKobo: number;
    orderStatus: string;
    notes?: string;
    modifiers?: any;
    createdAt: string;
  }[];
}

export interface TrackingData {
  businessName: string;
  branchName: string;
  logoUrl?: string;
  branchId: string;
  paymentAccountNumber?: string;
  tabStatus: string;
  tabId: string;
  tabType?: string;
  trackingGeneratedAt: string;
  overallStatus?: string;
  orders: {
    id: string;
    menuItemName: string;
    quantity: number;
    orderStatus: string;
    createdAt: string;
    approvedAt?: string;
    preparingAt?: string;
    actualReadyTime?: string;
    deliveredAt?: string;
    timerEndsAt?: string;
    declineReason?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private http: HttpClient;
  private env = inject(ENVIRONMENT_CONFIG);

  constructor(httpBackend: HttpBackend) {
    this.http = new HttpClient(httpBackend);
  }

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  openTab(branchId: string, tableId?: string, customerName?: string, partySize?: number, tabType?: string): Observable<OpenTabResponse> {
    const url = `${this.apiUrl}/api/v1/public/tabs`;
    const body: any = { branch_id: branchId, tab_type: tabType || 'dine_in' };
    if (tableId) body.table_id = tableId;
    if (customerName) body.customer_name = customerName;
    if (partySize) body.party_size = partySize;
    return this.http.post<any>(url, body).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<OpenTabResponse>(data);
      })
    );
  }

  placeOrder(tabId: string, trackingCode: string, items: { menu_item_id: string; quantity: number; notes?: string; modifiers?: any[] }[]): Observable<PlaceOrderResponse> {
    const url = `${this.apiUrl}/api/v1/public/tabs/${tabId}/orders`;
    return this.http.post<any>(url, { items }, { headers: { 'x-tracking-code': trackingCode, 'Content-Type': 'application/json' } }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<PlaceOrderResponse>(data);
      })
    );
  }

  getTabStatus(tabId: string, trackingCode: string): Observable<TabStatusResponse> {
    const url = `${this.apiUrl}/api/v1/public/tabs/${tabId}`;
    return this.http.get<any>(url, { headers: { 'x-tracking-code': trackingCode, 'Content-Type': 'application/json' } }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<TabStatusResponse>(data);
      })
    );
  }

  /** Self-service: customer confirms they received the order -> backend marks
   *  it DELIVERED. No supervisor handshake needed for self-service orders. */
  confirmReceived(tabId: string, trackingCode: string): Observable<TabStatusResponse> {
    const url = `${this.apiUrl}/api/v1/public/tabs/${tabId}/confirm-received`;
    return this.http.post<any>(url, {}, { headers: { 'x-tracking-code': trackingCode, 'Content-Type': 'application/json' } }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<TabStatusResponse>(data);
      })
    );
  }

  initializePayment(tabId: string, trackingCode: string): Observable<PaymentInitResponse> {
    const url = `${this.apiUrl}/api/v1/public/payments/initialize`;
    return this.http.post<any>(url, { tab_id: tabId, tracking_code: trackingCode }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<PaymentInitResponse>(data);
      })
    );
  }

  getPaymentStatus(tabId: string, trackingCode: string): Observable<PaymentStatusResponse> {
    const url = `${this.apiUrl}/api/v1/public/payments/status?tab_id=${tabId}&tracking_code=${trackingCode}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<PaymentStatusResponse>(data);
      })
    );
  }

  /** TEST MODE: fire a dummy OPay "transfer received" webhook for the tab's bill.
   *  Temporarily re-enabled in all environments (incl. production) during
   *  pre-launch so payments can be verified end-to-end without a terminal. */
  simulateOpayWebhook(reference: string, amountKobo: number): Observable<any> {
    const url = `${this.apiUrl}/api/v1/public/payments/webhooks/opay`;
    return this.http.post<any>(url, {
      data: {
        reference,
        amount: amountKobo,
        status: 'SUCCESS',
        transactionType: 'TRANSFER',
      },
    }, {
      headers: { 'x-simulate': '1' },
    }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return data;
      })
    );
  }

  /** Self-service: submit a star rating + optional comment after payment. */
  submitReview(tabId: string, trackingCode: string, body: { rating: number; comment?: string }): Observable<any> {
    const url = `${this.apiUrl}/api/v1/public/tabs/${tabId}/review`;
    return this.http.post<any>(url, body, { headers: { 'x-tracking-code': trackingCode, 'Content-Type': 'application/json' } }).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return data;
      })
    );
  }

  getTrackingByCode(code: string): Observable<TrackingData> {
    const url = `${this.apiUrl}/api/v1/tracking/${code}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) data = data.data;
        return snakeToCamel<TrackingData>(data);
      })
    );
  }
}