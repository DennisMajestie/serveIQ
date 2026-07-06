import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { PeakHoursEntry, TableVelocityEntry, PeakEfficiencyEntry, SalesEntry, TopItemEntry } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  getSales(dateFrom?: string, dateTo?: string, paymentMethod?: string): Observable<SalesEntry[]> {
    const queryParams: Record<string, string> = {};
    if (dateFrom) queryParams['dateFrom'] = dateFrom;
    if (dateTo) queryParams['dateTo'] = dateTo;
    if (paymentMethod) queryParams['paymentMethod'] = paymentMethod;
    return this.get<SalesEntry[]>(API_CONFIG.endpoints.reports.sales, undefined, queryParams);
  }

  getTopItems(dateFrom?: string, dateTo?: string, category?: string): Observable<TopItemEntry[]> {
    const queryParams: Record<string, string> = {};
    if (dateFrom) queryParams['dateFrom'] = dateFrom;
    if (dateTo) queryParams['dateTo'] = dateTo;
    if (category) queryParams['category'] = category;
    return this.get<TopItemEntry[]>(API_CONFIG.endpoints.reports.items, undefined, queryParams);
  }

  getPeakHours(branchId?: string, dateFrom?: string, dateTo?: string): Observable<PeakHoursEntry[]> {
    const queryParams: Record<string, string> = {};
    if (branchId) { queryParams['branchId'] = branchId; }
    if (dateFrom) { queryParams['dateFrom'] = dateFrom; }
    if (dateTo) { queryParams['dateTo'] = dateTo; }
    return this.get<PeakHoursEntry[]>(API_CONFIG.endpoints.reports.peakHours, undefined, queryParams);
  }

  getTableVelocity(branchId?: string, dateFrom?: string, dateTo?: string): Observable<TableVelocityEntry[]> {
    const queryParams: Record<string, string> = {};
    if (branchId) { queryParams['branchId'] = branchId; }
    if (dateFrom) { queryParams['dateFrom'] = dateFrom; }
    if (dateTo) { queryParams['dateTo'] = dateTo; }
    return this.get<TableVelocityEntry[]>(API_CONFIG.endpoints.reports.tableVelocity, undefined, queryParams);
  }

  getPeakEfficiency(dateFrom?: string, dateTo?: string): Observable<PeakEfficiencyEntry[]> {
    const queryParams: Record<string, string> = {};
    if (dateFrom) { queryParams['dateFrom'] = dateFrom; }
    if (dateTo) { queryParams['dateTo'] = dateTo; }
    return this.get<PeakEfficiencyEntry[]>(API_CONFIG.endpoints.reports.peakEfficiency, undefined, queryParams);
  }
}
