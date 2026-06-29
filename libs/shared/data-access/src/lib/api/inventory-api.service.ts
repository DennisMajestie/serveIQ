import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { InventoryItem, CreateInventoryRequest, StockMovement, AddStockRequest, BestsellerReport } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<InventoryItem[]> {
    return this.get<InventoryItem[]>(API_CONFIG.endpoints.inventory.list);
  }

  getById(id: string): Observable<InventoryItem> {
    return this.get<InventoryItem>(buildUrl(API_CONFIG.endpoints.inventory.get, { id }));
  }

  create(data: CreateInventoryRequest): Observable<InventoryItem> {
    return this.post<InventoryItem>(API_CONFIG.endpoints.inventory.create, data);
  }

  update(id: string, data: Partial<CreateInventoryRequest>): Observable<InventoryItem> {
    return this.patch<InventoryItem>(buildUrl(API_CONFIG.endpoints.inventory.update, { id }), data);
  }

  removeById(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.inventory.delete, { id }));
  }

  addStock(id: string, data: AddStockRequest): Observable<StockMovement> {
    return this.post<StockMovement>(buildUrl(API_CONFIG.endpoints.inventory.stock, { id }), data);
  }

  getMovements(id: string): Observable<StockMovement[]> {
    return this.get<StockMovement[]>(buildUrl(API_CONFIG.endpoints.inventory.movements, { id }));
  }

  getAlerts(): Observable<InventoryItem[]> {
    return this.get<InventoryItem[]>(API_CONFIG.endpoints.inventory.alerts);
  }

  getBestsellers(dateFrom?: string, dateTo?: string): Observable<BestsellerReport> {
    return this.get<BestsellerReport>(API_CONFIG.endpoints.inventory.bestsellers, undefined, { dateFrom, dateTo } as any);
  }

  getStockVariance(): Observable<any> {
    return this.get<any>(API_CONFIG.endpoints.inventory.stockVariance);
  }
}
