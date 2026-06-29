import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Shift, OpenShiftRequest, CloseShiftRequest } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class ShiftsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<Shift[]> {
    return this.get<Shift[]>(API_CONFIG.endpoints.shifts.list);
  }

  getCurrent(): Observable<Shift> {
    return this.get<Shift>(API_CONFIG.endpoints.shifts.current);
  }

  open(data: OpenShiftRequest): Observable<Shift> {
    return this.post<Shift>(API_CONFIG.endpoints.shifts.open, data);
  }

  close(id: string, data: CloseShiftRequest): Observable<Shift> {
    return this.post<Shift>(buildUrl(API_CONFIG.endpoints.shifts.close, { id }), data);
  }
}
