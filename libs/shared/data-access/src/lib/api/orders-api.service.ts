import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { OrderItem, AddOrderItemsRequest } from '@serveiq/shared/models';

/** Manages order items within a tab. */
@Injectable({ providedIn: 'root' })
export class OrdersApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Get all order items for a tab. */
  getByTab(tabId: string): Observable<OrderItem[]> {
    return this.get<OrderItem[]>(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }));
  }

  /** Add items to a tab. */
  addItems(tabId: string, items: AddOrderItemsRequest[]): Observable<OrderItem[]> {
    return this.post<OrderItem[]>(buildUrl(API_CONFIG.endpoints.orders.byTab, { tabId }), items);
  }

  /** Get a single order item by ID. */
  getOrder(id: string): Observable<OrderItem> {
    return this.get<OrderItem>(buildUrl(API_CONFIG.endpoints.orders.get, { id }));
  }

  /** Update a single order item (quantity / notes). */
  updateItem(id: string, updates: Partial<Pick<OrderItem, 'quantity' | 'notes'>>): Observable<OrderItem> {
    return this.patch<OrderItem>(buildUrl(API_CONFIG.endpoints.orders.update, { id }), updates);
  }

  /** Remove a single order item. */
  deleteItem(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.orders.delete, { id }));
  }
}
