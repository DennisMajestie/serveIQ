import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Department } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class DepartmentsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  getAll(includeInactive?: boolean, branchId?: string): Observable<Department[]> {
    const params: Record<string, string> = {};
    if (includeInactive) params['include_inactive'] = 'true';
    if (branchId) params['branch_id'] = branchId;
    return this.get<Department[]>(API_CONFIG.endpoints.departments.list, undefined, params);
  }

  getById(id: string): Observable<Department> {
    return this.get<Department>(buildUrl(API_CONFIG.endpoints.departments.get, { id }));
  }

  create(name: string): Observable<Department> {
    return this.post<Department>(API_CONFIG.endpoints.departments.create, { name });
  }

  update(id: string, data: { name?: string; is_active?: boolean }): Observable<Department> {
    return this.patch<Department>(buildUrl(API_CONFIG.endpoints.departments.update, { id }), data);
  }

  remove(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.departments.delete, { id }));
  }
}
