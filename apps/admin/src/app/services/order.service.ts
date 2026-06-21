import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderItem } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  addOrders(tabId: string, items: { menu_item_id: string; quantity: number; notes?: string }[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/tab/${tabId}`, items);
  }

  getOrdersByTab(tabId: string): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.baseUrl}/orders/tab/${tabId}`);
  }

  getOrder(id: string): Observable<OrderItem> {
    return this.http.get<OrderItem>(`${this.baseUrl}/orders/${id}`);
  }

  updateOrder(id: string, payload: { quantity: number; notes?: string }): Observable<OrderItem> {
    return this.http.put<OrderItem>(`${this.baseUrl}/orders/${id}`, payload);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/orders/${id}`);
  }
}
