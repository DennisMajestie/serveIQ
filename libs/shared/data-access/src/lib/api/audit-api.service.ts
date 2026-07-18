import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { AuditLog, AuditLogResponse } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class AuditApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(params?: Record<string, string | number>): Observable<AuditLogResponse> {
    const queryParams: Record<string, string> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        queryParams[key] = String(value);
      }
    }
    return this.getPaginated<AuditLogResponse>(
      API_CONFIG.endpoints.auditLogs.list,
      undefined,
      Object.keys(queryParams).length ? queryParams : undefined,
    );
  }

  recent(): Observable<AuditLog[]> {
    return this.get<AuditLog[]>(API_CONFIG.endpoints.auditLogs.recent);
  }
}
