import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill } from '../models';

@Injectable({ providedIn: 'root' })
export class BillService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  generateBill(tabId: string, payload: { service_charge_percent?: number; discount_kobo?: number }): Observable<Bill> {
    return this.http.post<Bill>(`${this.baseUrl}/bills/tab/${tabId}/generate`, payload);
  }

  processPayment(tabId: string, payload: { amount: number; method: string; reference?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/bills/tab/${tabId}/pay`, payload);
  }

  getReceipt(tabId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/bills/tab/${tabId}/receipt`);
  }
}
