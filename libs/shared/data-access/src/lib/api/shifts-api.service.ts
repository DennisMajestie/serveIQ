import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Shift, ShiftTemplate, CreateShiftTemplateRequest, OpenShiftRequest, CloseShiftRequest, ShiftReport, ShiftSummary } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class ShiftsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  // Shift Templates
  listTemplates(): Observable<ShiftTemplate[]> {
    return this.get<ShiftTemplate[]>(API_CONFIG.endpoints.shifts.templates.list);
  }

  getTemplate(id: string): Observable<ShiftTemplate> {
    return this.get<ShiftTemplate>(buildUrl(API_CONFIG.endpoints.shifts.templates.get, { id }));
  }

  createTemplate(data: CreateShiftTemplateRequest): Observable<ShiftTemplate> {
    return this.post<ShiftTemplate>(API_CONFIG.endpoints.shifts.templates.create, data);
  }

  updateTemplate(id: string, data: Partial<CreateShiftTemplateRequest>): Observable<ShiftTemplate> {
    return this.patch<ShiftTemplate>(buildUrl(API_CONFIG.endpoints.shifts.templates.update, { id }), data);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.shifts.templates.delete, { id }));
  }

  // Shifts
  list(params?: { dateFrom?: string; dateTo?: string; status?: string }): Observable<Shift[]> {
    const queryParams: Record<string, string> = {};
    if (params?.dateFrom) queryParams['dateFrom'] = params.dateFrom;
    if (params?.dateTo) queryParams['dateTo'] = params.dateTo;
    if (params?.status) queryParams['status'] = params.status;
    return this.get<Shift[]>(API_CONFIG.endpoints.shifts.list, undefined, queryParams);
  }

  getCurrent(branchId?: string): Observable<Shift> {
    const queryParams: Record<string, string> = {};
    if (branchId) {
      queryParams['branchId'] = branchId;
    }
    return this.get<Shift>(API_CONFIG.endpoints.shifts.current, undefined, queryParams);
  }

  getById(id: string): Observable<Shift> {
    return this.get<Shift>(buildUrl(API_CONFIG.endpoints.shifts.get, { id }));
  }

  open(data: OpenShiftRequest): Observable<Shift> {
    return this.post<Shift>(API_CONFIG.endpoints.shifts.open, data);
  }

  close(id: string, data: CloseShiftRequest): Observable<Shift> {
    return this.post<Shift>(buildUrl(API_CONFIG.endpoints.shifts.close, { id }), data);
  }

  // Shift Reports
  getShiftReport(shiftId: string): Observable<ShiftReport> {
    return this.get<ShiftReport>(buildUrl(API_CONFIG.endpoints.shifts.report, { id: shiftId }));
  }

  getShiftSummary(dateFrom?: string, dateTo?: string): Observable<ShiftSummary[]> {
    const queryParams: Record<string, string> = {};
    if (dateFrom) queryParams['dateFrom'] = dateFrom;
    if (dateTo) queryParams['dateTo'] = dateTo;
    return this.get<ShiftSummary[]>(API_CONFIG.endpoints.shifts.summary, undefined, queryParams);
  }
}
