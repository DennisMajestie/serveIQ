import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { buildUrl } from './api.config';
import { handleApiError } from './api-error';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { snakeToCamel, camelToSnake } from '@serveiq/shared/models';

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

  /**
   * GET request for non-paginated or bare-array responses.
   * Unwraps the TransformInterceptor's { success, data } envelope, and if the inner
   * data also contains a { data: [...], meta } shape, strips the meta wrapper and
   * returns only the array. Use this for single-entity endpoints or list endpoints
   * where you only need the array (pagination metadata is discarded).
   *
   * For paginated endpoints that need the full { data: T[]; meta: {...} } shape,
   * use getPaginated<T>() instead.
   */
  protected get<T>(url: string, params?: Record<string, string | number>, queryParams?: Record<string, string>): Observable<T> {
    const fullUrl = this.buildFullUrl(url, params);
    let httpParams = new HttpParams();
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http
      .get<any>(fullUrl, { headers: this.defaultHeaders, params: httpParams })
      .pipe(
        map(res => {
          let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            data = data.data;
          }
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  /**
   * GET request for paginated endpoints.
   * Unwraps the TransformInterceptor's { success, data } envelope ONCE,
   * preserving the inner { data: T[], meta: {...} } shape.
   * Use this for any endpoint that returns paginated results with metadata
   * (e.g. audit logs, admin business list). Do NOT use get<T>() for paginated
   * responses — it strips the meta field via its second unwrap.
   */
  protected getPaginated<T>(url: string, params?: Record<string, string | number>, queryParams?: Record<string, string>): Observable<T> {
    const fullUrl = this.buildFullUrl(url, params);
    let httpParams = new HttpParams();
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http
      .get<any>(fullUrl, { headers: this.defaultHeaders, params: httpParams })
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
      .post<any>(fullUrl, camelToSnake(body), { headers: this.defaultHeaders })
      .pipe(
        map(res => {
          let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
          if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            data = data.data;
          }
          return snakeToCamel<T>(data);
        }),
        catchError(handleApiError)
      );
  }

  // PUT Request
  protected put<T>(url: string, body: any): Observable<T> {
    const fullUrl = this.buildFullUrl(url);
    return this.http
      .put<any>(fullUrl, camelToSnake(body), { headers: this.defaultHeaders })
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
      .patch<any>(fullUrl, camelToSnake(body), { headers: this.defaultHeaders })
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
