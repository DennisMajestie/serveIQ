import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { MenuItem, CreateMenuItemRequest } from '@serveiq/shared/models';

export interface MenuCategory {
  id: string;
  branch_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface Unit {
  id: string;
  branch_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Get all menu items. */
  getAllItems(): Observable<MenuItem[]> {
    return this.get<MenuItem[]>(API_CONFIG.endpoints.menu.list);
  }

  /** Get a single menu item by ID. */
  getMenuItem(id: string): Observable<MenuItem> {
    return this.get<MenuItem>(buildUrl(API_CONFIG.endpoints.menu.get, { id }));
  }

  /** Create a new menu item. */
  createItem(data: CreateMenuItemRequest): Observable<MenuItem> {
    return this.post<MenuItem>(API_CONFIG.endpoints.menu.create, data);
  }

  /** Update an existing menu item (availability, price, etc.). */
  updateItem(id: string, data: Partial<MenuItem>): Observable<MenuItem> {
    return this.patch<MenuItem>(buildUrl(API_CONFIG.endpoints.menu.update, { id }), data);
  }

  /** Delete a menu item permanently. */
  deleteItem(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.menu.delete, { id }));
  }

  /** Bulk import menu items from CSV. */
  importCsv(file: File): Observable<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imported: number; errors: string[] }>(
      `${this.apiUrl}${API_CONFIG.endpoints.menuImport}`, formData
    );
  }

  /** Toggle menu item availability without deleting. */
  toggleAvailability(id: string): Observable<any> {
    return this.patch<any>(buildUrl(API_CONFIG.endpoints.menuToggle, { id }), {});
  }

  /** List menu categories for the branch. */
  getCategories(): Observable<MenuCategory[]> {
    return this.get<MenuCategory[]>(API_CONFIG.endpoints.menuCategories.list);
  }

  /** Create a new menu category. */
  createCategory(name: string): Observable<MenuCategory> {
    return this.post<MenuCategory>(API_CONFIG.endpoints.menuCategories.create, { name });
  }

  /** List units for the branch. */
  getUnits(): Observable<Unit[]> {
    return this.get<Unit[]>(API_CONFIG.endpoints.units.list);
  }

  /** Create a new unit. */
  createUnit(name: string): Observable<Unit> {
    return this.post<Unit>(API_CONFIG.endpoints.units.create, { name });
  }
}
