import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Department } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class DepartmentsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  getAll(): Observable<Department[]> {
    return this.get<Department[]>(API_CONFIG.endpoints.departments.list);
  }
}
