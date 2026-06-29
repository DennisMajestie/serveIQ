import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { PeakHoursEntry } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  getPeakHours(branchId: string, dateFrom?: string, dateTo?: string): Observable<PeakHoursEntry[]> {
    const params: Record<string, string> = { branchId };
    if (dateFrom) { params['dateFrom'] = dateFrom; }
    if (dateTo) { params['dateTo'] = dateTo; }
    return this.get<PeakHoursEntry[]>(API_CONFIG.endpoints.reports.peakHours, params);
  }
}
