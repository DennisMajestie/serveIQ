import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { AuditLog, AuditLogResponse, snakeToCamel } from '@serveiq/shared/models';
import { catchError } from 'rxjs/operators';
import { handleApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class AuditApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(params?: Record<string, string | number>): Observable<AuditLogResponse> {
    const fullUrl = `${this.apiUrl}${API_CONFIG.endpoints.auditLogs.list}`;
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<any>(fullUrl, { headers: this.defaultHeaders, params: httpParams }).pipe(
      map(res => {
        const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        return snakeToCamel<AuditLogResponse>(data);
      }),
      catchError(handleApiError)
    );
  }

  recent(): Observable<AuditLog[]> {
    return this.get<AuditLog[]>(API_CONFIG.endpoints.auditLogs.recent);
  }
}
