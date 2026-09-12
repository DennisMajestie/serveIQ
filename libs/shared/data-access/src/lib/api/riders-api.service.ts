import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Rider, RiderPendingPayout, RiderPayoutDetail, RiderLedgerEntry, PayoutBatch, PayoutProvider } from '@serveiq/shared/models';

export interface CreateRiderRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  vehicle?: string;
  branchId: string;
}

export interface RiderOnlineToggle {
  riderId: string;
  isOnline: boolean;
}

export interface ProcessPayoutRequest {
  provider?: PayoutProvider;
  providerBatchId?: string;
}

export interface CompletePayoutBatchRequest {
  providerBatchId: string;
}

export interface FailPayoutBatchRequest {
  reason: string;
}

/** Manages delivery riders (manager/owner) and rider online availability. */
@Injectable({ providedIn: 'root' })
export class RidersApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** List delivery riders for the business. branchId scopes to one branch. */
  list(branchId?: string): Observable<Rider[]> {
    const params = branchId ? { branch_id: branchId } : undefined;
    return this.get<Rider[]>(API_CONFIG.endpoints.riders.list, undefined, params);
  }

  /** Create a delivery rider (creates a rider user account + PIN-less password). */
  create(data: CreateRiderRequest): Observable<Rider> {
    return this.post<Rider>(API_CONFIG.endpoints.riders.create, data);
  }

  /** Update branch assignment, vehicle, online availability or active state. */
  update(id: string, data: Partial<Pick<Rider, 'branchId' | 'isOnline' | 'vehicle' | 'isActive'>>): Observable<Rider> {
    return this.patch<Rider>(buildUrl(API_CONFIG.endpoints.riders.update, { id }), data);
  }

  /** Delete a delivery rider (deactivates the underlying user). */
  remove(id: string): Observable<{ success: boolean }> {
    return this.delete<{ success: boolean }>(buildUrl(API_CONFIG.endpoints.riders.delete, { id }));
  }

  /** Toggle the authenticated rider's online availability. */
  toggleOnline(): Observable<RiderOnlineToggle> {
    return this.post<RiderOnlineToggle>(API_CONFIG.endpoints.riders.toggleOnline, {});
  }

  // ===== PAYOUT ENDPOINTS =====

  /** Get pending payout summary for all riders in a branch (manager view) */
  getPendingPayouts(branchId?: string): Observable<RiderPendingPayout[]> {
    const params = branchId ? { branch_id: branchId } : undefined;
    return this.get<RiderPendingPayout[]>(API_CONFIG.endpoints.deliveries.pendingPayouts, undefined, params);
  }

  /** Get pending payout details for a specific rider */
  getRiderPendingPayouts(riderId: string): Observable<RiderPayoutDetail> {
    return this.get<RiderPayoutDetail>(buildUrl(API_CONFIG.endpoints.riders.pendingPayouts, { id: riderId }));
  }

  /** Get earnings/payout ledger for a rider */
  getRiderLedger(riderId: string, limit?: number): Observable<RiderLedgerEntry[]> {
    const params = limit ? { limit: String(limit) } : undefined;
    return this.get<RiderLedgerEntry[]>(buildUrl(API_CONFIG.endpoints.riders.ledger, { id: riderId }), undefined, params);
  }

  /** Get payout batch history for a rider */
  getRiderPayoutBatches(riderId: string, limit?: number): Observable<PayoutBatch[]> {
    const params = limit ? { limit: String(limit) } : undefined;
    return this.get<PayoutBatch[]>(buildUrl(API_CONFIG.endpoints.riders.payoutBatches, { id: riderId }), undefined, params);
  }

  /** Process payout for a rider (manager/owner only) */
  processRiderPayout(riderId: string, data: ProcessPayoutRequest): Observable<{ batch: PayoutBatch; deliveriesPaid: number; totalKobo: number }> {
    return this.post<{ batch: PayoutBatch; deliveriesPaid: number; totalKobo: number }>(buildUrl(API_CONFIG.endpoints.riders.processPayout, { id: riderId }), data);
  }
}