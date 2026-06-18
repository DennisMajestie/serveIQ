import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { Tab } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class TabsApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
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

  // Update a tab (uses close endpoint with partial payload)
  updateTab(id: string, updates: Partial<Tab>): Observable<Tab> {
    return this.patch<Tab>(buildUrl(API_CONFIG.endpoints.tabs.close, { id }), updates);
  }

  // Close a tab
  closeTab(id: string): Observable<Tab> {
    return this.post<Tab>(API_CONFIG.endpoints.tabs.close, { id });
  }
}
