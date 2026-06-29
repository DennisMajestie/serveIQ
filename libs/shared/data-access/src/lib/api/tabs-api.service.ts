import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Tab } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class TabsApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  // Get all tabs
  getAllTabs(): Observable<Tab[]> {
    return this.get<Tab[]>(API_CONFIG.endpoints.tabs.list);
  }

  // Get a single tab
  getTab(id: string): Observable<Tab> {
    return this.get<Tab>(API_CONFIG.endpoints.tabs.get, { id });
  }

  // Open a new tab (create)
  createTab(tab: Partial<Tab>): Observable<Tab> {
    return this.post<Tab>(API_CONFIG.endpoints.tabs.open, tab);
  }

  // Update a tab
  updateTab(id: string, updates: Partial<Tab>): Observable<Tab> {
    return this.patch<Tab>(buildUrl(API_CONFIG.endpoints.tabs.get, { id }), updates);
  }

  // Close a tab
  closeTab(id: string): Observable<Tab> {
    return this.post<Tab>(API_CONFIG.endpoints.tabs.close, { id });
  }

  // Delete a tab
  deleteTab(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.tabs.delete, { id }));
  }

  // Alias for convenience
  getAll(): Observable<Tab[]> {
    return this.getAllTabs();
  }

  // Void a tab
  voidTab(id: string): Observable<Tab> {
    return this.post<Tab>(buildUrl(API_CONFIG.endpoints.tabs.close, { id }), {});
  }

  // Transfer a tab to another table
  transferTab(id: string, targetTableId: string): Observable<Tab> {
    return this.patch<Tab>(buildUrl(API_CONFIG.endpoints.tabs.get, { id }), { tableId: targetTableId });
  }
}
