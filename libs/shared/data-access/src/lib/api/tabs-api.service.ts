import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { expand, reduce, map } from 'rxjs/operators';
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

  /**
   * Fetch all tabs matching the given query params.
   * Internally uses getPaginated with a multi-page loop to ensure ALL matching
   * records are returned, regardless of the server's per_page ceiling (100).
   * Pass status: 'open' to fetch only open tabs.
   */
  getAllTabs(queryParams?: Record<string, string>): Observable<Tab[]> {
    const params = { per_page: '100', ...queryParams, page: '1' };
    return this.getPaginated<{ data: Tab[]; meta: { total: number; page: number; perPage: number; totalPages: number } }>(
      API_CONFIG.endpoints.tabs.list, undefined, params
    ).pipe(
      expand(res => {
        if (res.meta.page >= res.meta.totalPages) return EMPTY;
        return this.getPaginated<{ data: Tab[]; meta: { total: number; page: number; perPage: number; totalPages: number } }>(
          API_CONFIG.endpoints.tabs.list, undefined,
          { ...queryParams, per_page: '100', page: String(res.meta.page + 1) }
        );
      }),
      reduce((acc, res) => [...acc, ...res.data], [] as Tab[]),
    );
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
    return this.post<Tab>(buildUrl(API_CONFIG.endpoints.tabs.close, { id }), {});
  }

  // Delete a tab
  deleteTab(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.tabs.delete, { id }));
  }

  /**
   * Fetch ALL tabs matching optional filters by walking paginated pages.
   * Use this when the caller needs the complete dataset (e.g. history, bills,
   * search, dashboard stats). For the common "which tables have open tabs" case
   * use getAllTabs({ status: 'open' }) instead.
   */
  getAllTabsUnpaginated(filters?: Record<string, string>): Observable<Tab[]> {
    return new Observable<Tab[]>(observer => {
      const acc: Tab[] = [];
      const perPage = '100';
      const fetchPage = (page: number) => {
        const params: Record<string, string> = { ...filters, page: String(page), per_page: perPage };
        this.getPaginated<{ data: Tab[]; meta: { total: number; totalPages: number } }>(
          API_CONFIG.endpoints.tabs.list, undefined, params
        ).subscribe({
          next: (res) => {
            acc.push(...res.data);
            if (page < res.meta.totalPages) {
              fetchPage(page + 1);
            } else {
              observer.next(acc);
              observer.complete();
            }
          },
          error: (err) => observer.error(err),
        });
      };
      fetchPage(1);
    });
  }

  // Alias for convenience
  getAll(): Observable<Tab[]> {
    return this.getAllTabs();
  }

  // Void a tab
  voidTab(id: string): Observable<Tab> {
    return this.post<Tab>(buildUrl(API_CONFIG.endpoints.tabs.void, { id }), {});
  }

  // Transfer a tab to another table
  transferTab(id: string, targetTableId: string): Observable<Tab> {
    return this.post<Tab>(buildUrl(API_CONFIG.endpoints.tabs.transfer, { id }), { targetTableId });
  }

  // Merge this tab into another open tab (orders move onto the target)
  mergeTab(id: string, targetTabId: string): Observable<Tab> {
    return this.post<Tab>(buildUrl(API_CONFIG.endpoints.tabs.merge, { id }), { target_tab_id: targetTabId });
  }

  // Get list of users who have tabs in the branch (for waiter filter)
  getWaiterList(): Observable<{ id: string; fullName: string; role: string }[]> {
    return this.get<any[]>(API_CONFIG.endpoints.tabs.waiterList).pipe(
      map(list => list.map(w => ({ id: w.id, fullName: w.fullName || w.full_name, role: w.role })))
    );
  }
}
