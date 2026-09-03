import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Branch, CreateBranchRequest, DashboardStats, BusinessKPIs, BranchKPI } from '@serveiq/shared/models';

export interface PlatformPaymentProviderSummary {
  name: string;
  label: string;
  type: 'manual' | 'webhook';
  verification_method?: 'hmac-sha512' | 'rsa' | 'none';

  // camelCase aliases (after BaseApiService's snake→camel transform)
  verificationMethod?: 'hmac-sha512' | 'rsa' | 'none';
}

/** Manages CRUD operations for restaurant branches. */
@Injectable({ providedIn: 'root' })
export class BranchesApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** List all branches for the authenticated business. */
  list(): Observable<Branch[]> {
    return this.get<Branch[]>(API_CONFIG.endpoints.branches.list);
  }

  /** Get a single branch by ID. */
  getById(id: string): Observable<Branch> {
    return this.get<Branch>(buildUrl(API_CONFIG.endpoints.branches.get, { id }));
  }

  /** Create a new branch. */
  create(data: CreateBranchRequest): Observable<Branch> {
    return this.post<Branch>(API_CONFIG.endpoints.branches.create, data);
  }

  /** Update an existing branch. */
  update(id: string, data: Partial<CreateBranchRequest>): Observable<Branch> {
    return this.patch<Branch>(buildUrl(API_CONFIG.endpoints.branches.update, { id }), data);
  }

  /** Update branch settings (payment provider, webhook keys, takeaway policy). */
  updateSettings(id: string, data: { settings: Record<string, any> }): Observable<Branch> {
    return this.patch<Branch>(buildUrl(API_CONFIG.endpoints.branches.update, { id }) + '/settings', data);
  }

  /** Get per-branch feature flags (e.g. { kds_enabled: true }). */
  getFeatureFlags(id: string): Observable<Record<string, boolean>> {
    return this.get<Record<string, boolean>>(
      buildUrl(API_CONFIG.endpoints.branches.featureFlags, { id }),
    );
  }

  /** Set per-branch feature flags (e.g. { kds_enabled: true }). */
  updateFeatureFlags(id: string, flags: Record<string, boolean>): Observable<Record<string, boolean>> {
    return this.patch<Record<string, boolean>>(
      buildUrl(API_CONFIG.endpoints.branches.featureFlags, { id }),
      flags,
    );
  }

  /** Get dashboard summary stats (tables, open tabs, orders). */
  getStats(): Observable<DashboardStats> {
    return this.get<DashboardStats>(API_CONFIG.endpoints.branches.stats);
  }

  /** Get aggregated KPIs across all branches for the business. */
  getBusinessKPIs(dateFrom?: string, dateTo?: string): Observable<BusinessKPIs> {
    const queryParams: Record<string, string> = {};
    if (dateFrom) queryParams['dateFrom'] = dateFrom;
    if (dateTo) queryParams['dateTo'] = dateTo;
    return this.get<BusinessKPIs>(API_CONFIG.endpoints.branches.businessKpis, undefined, queryParams);
  }

  /** List platform-wide payment providers defined by the super admin. */
  getPlatformPaymentProviders(): Observable<PlatformPaymentProviderSummary[]> {
    return this.get<PlatformPaymentProviderSummary[]>(API_CONFIG.endpoints.branches.paymentProviders);
  }

  /** Delete a branch. */
  removeBranch(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.branches.delete, { id }));
  }

  /** Generate a QR code PNG for the public menu page. */
  generateQrCode(id: string): Observable<Blob> {
    const url = `${this.apiUrl}${buildUrl(API_CONFIG.endpoints.branches.generateQr, { id })}`;
    return this.http.post(url, {}, { responseType: 'blob' });
  }
}
