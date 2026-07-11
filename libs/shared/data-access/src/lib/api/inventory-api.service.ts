import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { MenuItem, RestockRequest, AuditEntry, ReconcileRequest, ReconcileAdjustment, DailyTallyReport, StockMovement } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<MenuItem[]> {
    return this.get<MenuItem[]>(API_CONFIG.endpoints.inventory.list);
  }

  getById(id: string): Observable<MenuItem> {
    return this.get<MenuItem>(buildUrl(API_CONFIG.endpoints.inventory.get, { id }));
  }

  create(data: any): Observable<MenuItem> {
    return this.post<MenuItem>(API_CONFIG.endpoints.inventory.create, data);
  }

  update(id: string, data: Partial<MenuItem>): Observable<MenuItem> {
    return this.patch<MenuItem>(buildUrl(API_CONFIG.endpoints.inventory.update, { id }), data);
  }

  removeById(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.inventory.delete, { id }));
  }

  restock(id: string, data: RestockRequest): Observable<MenuItem> {
    return this.post<MenuItem>(buildUrl(API_CONFIG.endpoints.inventory.restock, { id }), data);
  }

  getMovements(id: string): Observable<StockMovement[]> {
    return this.get<StockMovement[]>(buildUrl(API_CONFIG.endpoints.inventory.movements, { id }));
  }

  getAlerts(): Observable<MenuItem[]> {
    return this.get<MenuItem[]>(API_CONFIG.endpoints.inventory.alerts);
  }

  getBestsellers(dateFrom?: string, dateTo?: string): Observable<any> {
    return this.get<any>(API_CONFIG.endpoints.inventory.bestsellers, undefined, { dateFrom, dateTo } as any);
  }

  getStockVariance(): Observable<any> {
    return this.get<any>(API_CONFIG.endpoints.inventory.stockVariance);
  }

  getAudit(): Observable<AuditEntry[]> {
    return this.get<AuditEntry[]>(API_CONFIG.endpoints.inventory.audit);
  }

  reconcile(data: ReconcileRequest): Observable<{ adjustments: ReconcileAdjustment[] }> {
    return this.post<{ adjustments: ReconcileAdjustment[] }>(API_CONFIG.endpoints.inventory.reconcile, data);
  }

  getDailyTally(date: string): Observable<DailyTallyReport> {
    return this.get<DailyTallyReport>(API_CONFIG.endpoints.reports.dailyTally, undefined, { date });
  }

  getUntrackedItems(): Observable<MenuItem[]> {
    return this.get<MenuItem[]>(API_CONFIG.endpoints.inventory.untrackedItems);
  }
}
