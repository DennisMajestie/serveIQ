import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tab } from '../models';

@Injectable({ providedIn: 'root' })
export class TabService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  getTabs(status?: 'open' | 'billed' | 'paid' | 'voided'): Observable<Tab[]> {
    let url = `${this.baseUrl}/tabs`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Tab[]>(url);
  }

  openTab(payload: { table_id: string; customer_name?: string; party_size: number; notes?: string }): Observable<Tab> {
    return this.http.post<Tab>(`${this.baseUrl}/tabs/open`, payload);
  }

  getTab(id: string): Observable<Tab> {
    return this.http.get<Tab>(`${this.baseUrl}/tabs/${id}`);
  }

  closeTab(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tabs/${id}/close`, {});
  }
}
