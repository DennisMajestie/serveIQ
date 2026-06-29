import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Supplier, CreateSupplierRequest } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class SuppliersApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<Supplier[]> {
    return this.get<Supplier[]>(API_CONFIG.endpoints.suppliers.list);
  }

  getById(id: string): Observable<Supplier> {
    return this.get<Supplier>(buildUrl(API_CONFIG.endpoints.suppliers.get, { id }));
  }

  create(data: CreateSupplierRequest): Observable<Supplier> {
    return this.post<Supplier>(API_CONFIG.endpoints.suppliers.create, data);
  }

  update(id: string, data: Partial<CreateSupplierRequest>): Observable<Supplier> {
    return this.patch<Supplier>(buildUrl(API_CONFIG.endpoints.suppliers.update, { id }), data);
  }

  removeById(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.suppliers.delete, { id }));
  }
}
