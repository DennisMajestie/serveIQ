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
  subscription_status?: string;
  subscription_expires_at?: string;
  is_active: boolean;
  created_at: string;
  branches?: { id: string; name: string }[];
  owner?: { id: string; full_name?: string; fullName?: string; email?: string };

  // camelCase aliases (optional) used after client-side conversion
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type SubscriptionFilter = 'all' | 'active' | 'expired' | 'trialing' | 'past_due' | 'canceled';

export interface AdminPaymentProvider {
  id: string;
  name: string;
  label: string;
  type: 'manual' | 'webhook';
  verification_method?: 'hmac-sha512' | 'rsa' | 'none';
  config: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // camelCase aliases (after BaseApiService's snake→camel transform)
  isActive?: boolean;
  verificationMethod?: 'hmac-sha512' | 'rsa' | 'none';
}

export interface CreateAdminPaymentProviderInput {
  name: string;
  label: string;
  type?: 'manual' | 'webhook';
  verification_method?: 'hmac-sha512' | 'rsa' | 'none';
  config?: Record<string, string>;
  is_active?: boolean;
}

export interface AdminSystemHealth {
  status: string;
  timestamp: string;
  uptimeSeconds?: number;
  database: {
    connected?: boolean;
    latencyMs?: number | null;
  };
  environment?: string;
  nodeVersion?: string;
  process?: {
    pid?: number;
    memoryUsedMb?: number;
    memoryHeapUsedMb?: number;
    cpuCores?: number;
    loadAvg?: number[];
  };
  syncQueue?: {
    total?: number;
    pending?: number;
    failed?: number;
  };
}

export interface AdminAuditLog {
  id: string;
  branchId: string;
  branchName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  businessName?: string;
  businessCurrency?: string;
  action: string;
  entityId?: string;
  entityType?: string;
  payload?: any;
  createdAt: string;
}

export interface AdminAuditLogResponse {
  data: AdminAuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminSubscriptionBreakdownEntry {
  plan?: string;
  count?: number;
}

export interface AdminSubscriptionStatusEntry {
  status?: string;
  count?: number;
}

export interface AdminRecentBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  is_active: boolean;
  subscription_plan: string;
  created_at: string;
}

export interface AdminStats {
  totalBusinesses?: number;
  activeBusinesses?: number;
  inactiveBusinesses?: number;
  subscriptionActive?: number;
  subscriptionExpired?: number;
  subscriptionPastDue?: number;
  subscriptionTrialing?: number;
  subscriptionCanceled?: number;
  totalBranches?: number;
  totalWaiters?: number;
  totalStaff?: number;
  totalManagers?: number;
  totalCashiers?: number;
  totalRevenueKobo?: number;
  newBusinessesThisMonth?: number;
  subscriptionBreakdown?: AdminSubscriptionBreakdownEntry[];
  subscriptionStatusBreakdown?: AdminSubscriptionStatusEntry[];
  recentBusinesses?: AdminRecentBusiness[];
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

  getSystemHealth(): Observable<AdminSystemHealth> {
    return this.get<AdminSystemHealth>(API_CONFIG.endpoints.admin.systemHealth);
  }

  getAdminAuditLogs(params?: Record<string, string | number>): Observable<AdminAuditLogResponse> {
    const queryParams: Record<string, string> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        queryParams[key] = String(value);
      }
    }
    return this.getPaginated<AdminAuditLogResponse>(
      API_CONFIG.endpoints.admin.auditLogs,
      undefined,
      Object.keys(queryParams).length ? queryParams : undefined,
    );
  }

  extendSubscription(businessId: string, days: number = 30): Observable<any> {
    return this.post<any>(API_CONFIG.endpoints.admin.extend, { business_id: businessId, days });
  }

  listPaymentProviders(includeInactive = true): Observable<AdminPaymentProvider[]> {
    return this.get<AdminPaymentProvider[]>(
      API_CONFIG.endpoints.admin.paymentProviders,
      undefined,
      { include_inactive: String(includeInactive) },
    );
  }

  createPaymentProvider(data: CreateAdminPaymentProviderInput): Observable<AdminPaymentProvider> {
    return this.post<AdminPaymentProvider>(API_CONFIG.endpoints.admin.paymentProviders, data);
  }

  updatePaymentProvider(id: string, data: Partial<CreateAdminPaymentProviderInput>): Observable<AdminPaymentProvider> {
    return this.patch<AdminPaymentProvider>(buildUrl(API_CONFIG.endpoints.admin.paymentProvider, { id }), data);
  }

  deletePaymentProvider(id: string): Observable<{ id: string }> {
    return this.delete<{ id: string }>(buildUrl(API_CONFIG.endpoints.admin.paymentProvider, { id }));
  }
}
