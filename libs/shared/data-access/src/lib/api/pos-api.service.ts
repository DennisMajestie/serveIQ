import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

export interface PosTerminal {
  id: string;
  label: string;
  is_active: boolean;
  branch_id?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PosApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  getAll(): Observable<PosTerminal[]> {
    return this.get<PosTerminal[]>(API_CONFIG.endpoints.pos.list);
  }

  getActive(): Observable<PosTerminal[]> {
    return this.get<PosTerminal[]>(API_CONFIG.endpoints.pos.active);
  }

  get(id: string): Observable<PosTerminal> {
    return this.get<PosTerminal>(buildUrl(API_CONFIG.endpoints.pos.get, { id }));
  }

  create(data: Partial<PosTerminal>): Observable<PosTerminal> {
    return this.post<PosTerminal>(API_CONFIG.endpoints.pos.create, data);
  }

  update(id: string, data: Partial<PosTerminal>): Observable<PosTerminal> {
    return this.patch<PosTerminal>(buildUrl(API_CONFIG.endpoints.pos.update, { id }), data);
  }

  remove(id: string): Observable<any> {
    return super.delete(buildUrl(API_CONFIG.endpoints.pos.delete, { id }));
  }
}
