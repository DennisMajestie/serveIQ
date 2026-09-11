import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { DeliveryJob } from '@serveiq/shared/models';

/** Dispatch deliveries: manager dispatch view + rider job board actions. */
@Injectable({ providedIn: 'root' })
export class DeliveriesApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Manager/owner: list deliveries for a branch (optionally filtered by status). */
  listByBranch(branchId: string, status?: string): Observable<DeliveryJob[]> {
    const params: Record<string, string> = { branch_id: branchId };
    if (status) params['status'] = status;
    return this.get<DeliveryJob[]>(API_CONFIG.endpoints.deliveries.list, undefined, params);
  }

  /** Rider: list available deliveries + the rider's own jobs for their branch. */
  available(): Observable<DeliveryJob[]> {
    return this.get<DeliveryJob[]>(API_CONFIG.endpoints.deliveries.available);
  }

  /** Rider: list my accepted/ongoing deliveries. */
  mine(): Observable<DeliveryJob[]> {
    return this.get<DeliveryJob[]>(API_CONFIG.endpoints.deliveries.mine);
  }

  /** Rider: accept an available delivery (first-accept wins). */
  accept(id: string): Observable<DeliveryJob> {
    return this.post<DeliveryJob>(buildUrl(API_CONFIG.endpoints.deliveries.accept, { id }), {});
  }

  /** Rider: mark a delivery as handed over to the customer. */
  deliver(id: string): Observable<DeliveryJob> {
    return this.post<DeliveryJob>(buildUrl(API_CONFIG.endpoints.deliveries.delivered, { id }), {});
  }

  /** Manager/owner: reassign an undelivered delivery to a new rider. */
  reassign(id: string): Observable<DeliveryJob> {
    return this.post<DeliveryJob>(buildUrl(API_CONFIG.endpoints.deliveries.reassign, { id }), {});
  }
}