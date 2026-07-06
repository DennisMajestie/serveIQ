import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Subscription, SubscriptionPlan, InitializeSubscriptionResponse } from '@serveiq/shared/models';

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

  initialize(planId: string): Observable<InitializeSubscriptionResponse> {
    return this.post<InitializeSubscriptionResponse>(API_CONFIG.endpoints.subscriptions.initialize, { plan_id: planId });
  }

  cancel(): Observable<Subscription> {
    return this.post<Subscription>(API_CONFIG.endpoints.subscriptions.cancel, {});
  }
}
