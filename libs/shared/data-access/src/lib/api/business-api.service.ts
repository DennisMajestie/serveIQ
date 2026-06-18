import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Business } from '@serveiq/shared/models';

/** Manages the authenticated owner's business profile. */
@Injectable({ providedIn: 'root' })
export class BusinessApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Get the business profile. */
  getBusiness(): Observable<Business> {
    return this.get<Business>(API_CONFIG.endpoints.business.get);
  }

  /** Update business name or type. */
  updateBusiness(data: Partial<Business>): Observable<Business> {
    return this.put<Business>(API_CONFIG.endpoints.business.update, data);
  }
}
