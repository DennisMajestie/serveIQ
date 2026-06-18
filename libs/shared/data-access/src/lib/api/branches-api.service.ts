import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { Branch, CreateBranchRequest, DashboardStats } from '@serveiq/shared/models';

/** Manages CRUD operations for restaurant branches. */
@Injectable({ providedIn: 'root' })
export class BranchesApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /** List all branches for the authenticated business. */
  list(): Observable<Branch[]> {
    return this.get<Branch[]>(API_CONFIG.endpoints.branches.list);
  }

  /** Get a single branch by ID. */
  getById(id: string): Observable<Branch> {
    return this.get<Branch>(buildUrl(API_CONFIG.endpoints.branches.get, { id }));
  }

  /** Create a new branch. */
  create(data: CreateBranchRequest): Observable<Branch> {
    return this.post<Branch>(API_CONFIG.endpoints.branches.create, data);
  }

  /** Update an existing branch. */
  update(id: string, data: Partial<CreateBranchRequest>): Observable<Branch> {
    return this.patch<Branch>(buildUrl(API_CONFIG.endpoints.branches.update, { id }), data);
  }

  /** Get dashboard summary stats (tables, open tabs, orders). */
  getStats(): Observable<DashboardStats> {
    return this.get<DashboardStats>(API_CONFIG.endpoints.branches.stats);
  }
}
