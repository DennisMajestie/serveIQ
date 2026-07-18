import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  // snake_case (from API)
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  branches?: { id: string; name: string }[];
  owner?: { id: string; full_name?: string; fullName?: string; email?: string };

  // camelCase aliases (optional) used after client-side conversion
  subscriptionPlan?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminStats {
  // snake_case (from API)
  total_businesses: number;
  active_businesses: number;
  total_branches: number;
  total_waiters: number;

  // camelCase equivalents (optional)
  totalBusinesses?: number;
  activeBusinesses?: number;
  totalBranches?: number;
  totalWaiters?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  listBusinesses(page?: number, perPage?: number): Observable<{ data: AdminBusiness[]; meta: any }> {
    const queryParams: Record<string, string> = {};
    if (page) queryParams['page'] = String(page);
    if (perPage) queryParams['per_page'] = String(perPage);
    return this.getPaginated<{ data: AdminBusiness[]; meta: any }>(
      API_CONFIG.endpoints.admin.businesses,
      undefined,
      Object.keys(queryParams).length ? queryParams : undefined,
    );
  }

  getBusiness(id: string): Observable<AdminBusiness> {
    return this.get<AdminBusiness>(buildUrl(API_CONFIG.endpoints.admin.business, { id }));
  }

  updateBusiness(id: string, data: Partial<AdminBusiness>): Observable<AdminBusiness> {
    return this.patch<AdminBusiness>(buildUrl(API_CONFIG.endpoints.admin.business, { id }), data);
  }

  toggleBusinessActive(id: string, isActive: boolean): Observable<AdminBusiness> {
    return this.updateBusiness(id, { is_active: isActive } as Partial<AdminBusiness>);
  }

  getStats(): Observable<AdminStats> {
    return this.get<AdminStats>(API_CONFIG.endpoints.admin.stats);
  }
}
