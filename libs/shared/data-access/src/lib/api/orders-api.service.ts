import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { OrderItem, AddOrderItemsRequest, Order, OrderGroup, KitchenCrewMember, ApproveOrderRequest, AcceptOrderRequest, DeclineOrderRequest } from '@serveiq/shared/models';

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

  cancelOrder(id: string, cancel_reason: string): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.cancel, { id }), { cancel_reason });
  }

  getPending(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.pending);
  }

  getActiveOrders(query?: { page?: number; per_page?: number; waiterId?: string }): Observable<OrderGroup[]> {
    const queryParams: Record<string, string> = {};
    if (query?.page) queryParams['page'] = String(query.page);
    if (query?.per_page) queryParams['per_page'] = String(query.per_page);
    if (query?.waiterId) queryParams['waiter_id'] = query.waiterId;
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.active, undefined, queryParams);
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

  getKitchenCrew(): Observable<KitchenCrewMember[]> {
    return this.get<KitchenCrewMember[]>(API_CONFIG.endpoints.orders.kitchenCrew);
  }

  getReadyForPickup(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.readyForPickup);
  }

  getPendingCash(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.pendingCash);
  }

  getOutForDelivery(): Observable<OrderGroup[]> {
    return this.get<OrderGroup[]>(API_CONFIG.endpoints.orders.outForDelivery);
  }

  deliverOrder(id: string): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.deliver, { id }), {});
  }

  confirmPickup(id: string): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.confirmPickup, { id }), {});
  }

  acceptOrder(id: string, body: AcceptOrderRequest): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.accept, { id }), body);
  }

  bumpOrder(id: string): Observable<Order> {
    return this.post<Order>(buildUrl(API_CONFIG.endpoints.orders.bump, { id }), {});
  }
}
