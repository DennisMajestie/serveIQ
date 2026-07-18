import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { OrderItem, AddOrderItemsRequest, Order, OrderGroup, ApproveOrderRequest, DeclineOrderRequest } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class OrdersApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  getByTab(tabId: string): Observable<OrderItem[]> {
    return this.get<OrderItem[]>(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }));
  }

  addItems(tabId: string, items: AddOrderItemsRequest[]): Observable<OrderItem[]> {
    return this.post<OrderItem[]>(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }), items);
  }

  getOrder(id: string): Observable<OrderItem> {
    return this.get<OrderItem>(buildUrl(API_CONFIG.endpoints.orders.get, { id }));
  }

  updateItem(id: string, updates: Partial<Pick<OrderItem, 'quantity' | 'notes'>>): Observable<OrderItem> {
    return this.patch<OrderItem>(buildUrl(API_CONFIG.endpoints.orders.update, { id }), updates);
  }

  deleteItem(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.orders.delete, { id }));
  }

  getPending(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.pending);
  }

  approveOrder(id: string, body: ApproveOrderRequest): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.approve, { id }), body);
  }

  declineOrder(id: string, body: DeclineOrderRequest): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.decline, { id }), body);
  }

  getPreparing(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.preparing);
  }

  getReadyForPickup(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.readyForPickup);
  }

  deliverOrder(id: string): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.deliver, { id }), {});
  }
}
