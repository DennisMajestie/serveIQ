import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Subscription, SubscriptionPlan, InitializeSubscriptionResponse } from '@serveiq/shared/models';

export type AdminBillingInterval = 'monthly' | 'yearly';

export interface CreatePlanPayload {
  name: string;
  price: number;
  currency: string;
  billing_interval: AdminBillingInterval;
  features?: Record<string, any>;
  is_active?: boolean;
  paystack_plan_code?: string;
}

export interface UpdatePlanPayload {
  name?: string;
  price?: number;
  currency?: string;
  billing_interval?: AdminBillingInterval;
  features?: Record<string, any>;
  is_active?: boolean;
  paystack_plan_code?: string;
}

export interface AdminPlan extends SubscriptionPlan {
  paystackPlanCode?: string | null;
  paystack_plan_code?: string | null;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  getCurrent(): Observable<Subscription> {
    return this.get<Subscription>(API_CONFIG.endpoints.subscriptions.current);
  }

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.get<SubscriptionPlan[]>(API_CONFIG.endpoints.plans.list);
  }

  initialize(planId: string, callbackUrl?: string): Observable<InitializeSubscriptionResponse> {
    return this.post<InitializeSubscriptionResponse>(API_CONFIG.endpoints.subscriptions.initialize, {
      plan_id: planId,
      callback_url: callbackUrl,
    });
  }

  verify(reference: string): Observable<Subscription> {
    return this.post<Subscription>(API_CONFIG.endpoints.subscriptions.verify, { reference });
  }

  cancel(): Observable<Subscription> {
    return this.post<Subscription>(API_CONFIG.endpoints.subscriptions.cancel, {});
  }

  getAllPlans(): Observable<AdminPlan[]> {
    return this.get<AdminPlan[]>(API_CONFIG.endpoints.adminPlans.list);
  }

  createPlan(payload: CreatePlanPayload): Observable<AdminPlan> {
    return this.post<AdminPlan>(API_CONFIG.endpoints.adminPlans.create, payload);
  }

  updatePlan(id: string, payload: UpdatePlanPayload): Observable<AdminPlan> {
    return this.patch<AdminPlan>(buildUrl(API_CONFIG.endpoints.adminPlans.update, { id }), payload);
  }

  togglePlanActive(id: string): Observable<AdminPlan> {
    return this.patch<AdminPlan>(buildUrl(API_CONFIG.endpoints.adminPlans.toggle, { id }), {});
  }

  deletePlan(id: string): Observable<{ success: boolean }> {
    return this.delete<{ success: boolean }>(buildUrl(API_CONFIG.endpoints.adminPlans.delete, { id }));
  }
}
