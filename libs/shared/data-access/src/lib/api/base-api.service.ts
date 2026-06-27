import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { buildUrl } from './api.config';
import { handleApiError } from './api-error';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { snakeToCamel } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  protected readonly defaultHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(
    protected http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) protected env: EnvironmentConfig
  ) {}

  protected get apiUrl(): string {
    return this.env.apiUrl;
  }

  // GET Request
  protected get<T>(url: string, params?: Record<string, string | number>): Observable<T> {
    const fullUrl = this.buildFullUrl(url, params);
    return this.http
      .get<any>(fullUrl, { headers: this.defaultHeaders })
      .pipe(
        map(res => {
          const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  // POST Request
  protected post<T>(url: string, body?: any): Observable<T> {
    const fullUrl = this.buildFullUrl(url);
    return this.http
      .post<any>(fullUrl, body, { headers: this.defaultHeaders })
      .pipe(
        map(res => {
          const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  // PUT Request
  protected put<T>(url: string, body: any): Observable<T> {
    const fullUrl = this.buildFullUrl(url);
    return this.http
      .put<any>(fullUrl, body, { headers: this.defaultHeaders })
      .pipe(
        map(res => {
          const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  // PATCH Request
  protected patch<T>(url: string, body: any): Observable<T> {
    const fullUrl = this.buildFullUrl(url);
    return this.http
      .patch<any>(fullUrl, body, { headers: this.defaultHeaders })
      .pipe(
        map(res => {
          const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  // DELETE Request
  protected delete<T>(url: string): Observable<T> {
    const fullUrl = this.buildFullUrl(url);
    return this.http
      .delete<T>(fullUrl, { headers: this.defaultHeaders })
      .pipe(catchError(handleApiError));
  }

  // Helper: Build full URL
  private buildFullUrl(urlTemplate: string, params?: Record<string, string | number>): string {
    const path = buildUrl(urlTemplate, params || {});
    return `${this.apiUrl}${path}`;
  }
}
