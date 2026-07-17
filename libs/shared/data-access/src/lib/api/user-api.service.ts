import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { User, CreateWaiterRequest } from '@serveiq/shared/models';
import { snakeToCamel } from '@serveiq/shared/models';
import { handleApiError } from './api-error';

/** Manages user profiles and waiter accounts. */
@Injectable({ providedIn: 'root' })
export class UserApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  /** Get the currently authenticated user's profile. */
  getMe(): Observable<User> {
    return this.get<User>(API_CONFIG.endpoints.users.me);
  }

  /** Update the authenticated user's name/email. */
  updateMe(data: Partial<Pick<User, 'fullName' | 'email'>>): Observable<User> {
    return this.patch<User>(API_CONFIG.endpoints.users.me, data);
  }

  /** Update any user by ID (owner only). */
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.patch<User>(buildUrl(API_CONFIG.endpoints.users.update, { id }), data);
  }

  /** List all waiters for the business. */
  listWaiters(): Observable<User[]> {
    return this.get<User[]>(API_CONFIG.endpoints.users.waiters);
  }

  /** List all staff (waiters + supervisors) for the business. */
  listStaff(): Observable<User[]> {
    return this.get<User[]>(`${API_CONFIG.endpoints.users.waiters}?role=all`);
  }

  /** Create a new waiter account (owner only). */
  createWaiter(data: CreateWaiterRequest): Observable<User> {
    const url = `${this.apiUrl}${API_CONFIG.endpoints.users.waiters}`;
    return this.http.post<any>(url, data, { headers: this.defaultHeaders }).pipe(
      map(res => {
        const d = res && typeof res === 'object' && 'data' in res ? res.data : res;
        return snakeToCamel<User>(d);
      }),
      catchError(handleApiError)
    );
  }

  /** Reset a staff member's PIN (owner only). */
  resetStaffPin(id: string, pin: string): Observable<void> {
    return this.patch<void>(buildUrl(API_CONFIG.endpoints.users.resetPin, { id }), { pin });
  }

  /** Delete a waiter (owner only). */
  deleteWaiter(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.users.delete, { id }));
  }

  /** Deactivate a user (owner only). Invalidates their PIN and active sessions. */
  deactivateUser(id: string): Observable<User> {
    return this.patch<User>(buildUrl(API_CONFIG.endpoints.users.deactivate, { id }), {});
  }

  /** Reactivate a user (owner only). A new PIN must be created afterward. */
  reactivateUser(id: string): Observable<User> {
    return this.patch<User>(buildUrl(API_CONFIG.endpoints.users.update, { id }), { isActive: true });
  }
}
