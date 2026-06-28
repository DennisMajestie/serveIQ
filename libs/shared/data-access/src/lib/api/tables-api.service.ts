import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Table, TableStatus } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class TablesApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  // Get all tables
  getAllTables(): Observable<Table[]> {
    return this.get<Table[]>(API_CONFIG.endpoints.tables.list);
  }

  // Get a single table
  getTable(id: string): Observable<Table> {
    return this.get<Table>(API_CONFIG.endpoints.tables.get, { id });
  }

  // Create a table
  createTable(table: Partial<Table>): Observable<Table> {
    return this.post<Table>(API_CONFIG.endpoints.tables.create, table);
  }

  // Update a table
  updateTable(id: string, updates: Partial<Table>): Observable<Table> {
    return this.patch<Table>(buildUrl(API_CONFIG.endpoints.tables.update, { id }), updates);
  }

  // Update table status
  updateTableStatus(id: string, status: TableStatus): Observable<Table> {
    return this.patch<Table>(buildUrl(API_CONFIG.endpoints.tables.updateStatus, { id }), { status });
  }

  // Delete a table
  deleteTable(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.tables.delete, { id }));
  }
}
