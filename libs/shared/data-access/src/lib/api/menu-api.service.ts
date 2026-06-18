import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { MenuItem, CreateMenuItemRequest } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class MenuApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
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
}
