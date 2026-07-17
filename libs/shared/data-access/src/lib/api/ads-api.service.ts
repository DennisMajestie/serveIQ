import { Inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { snakeToCamel } from '@serveiq/shared/models';

export interface Ad {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  branchId: string;
  createdAt?: string;
}

// Public-facing (no auth)
@Injectable({ providedIn: 'root' })
export class PublicAdsApiService {
  private http: HttpClient;
  private env: EnvironmentConfig;

  constructor(httpBackend: HttpBackend, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    this.http = new HttpClient(httpBackend);
    this.env = env;
  }

  getAds(branchId: string): Observable<Ad[]> {
    const url = `${this.env.apiUrl}${buildUrl(API_CONFIG.endpoints.publicAds, { branchId })}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) {
          data = data.data;
        }
        return (Array.isArray(data) ? data : []).map((item: any) => snakeToCamel<Ad>(item));
      })
    );
  }
}

// Admin CRUD (authenticated)
@Injectable({ providedIn: 'root' })
export class AdsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  getAll(): Observable<Ad[]> {
    return this.get<Ad[]>(API_CONFIG.endpoints.ads.list);
  }

  getById(id: string): Observable<Ad> {
    return this.get<Ad>(buildUrl(API_CONFIG.endpoints.ads.get, { id }));
  }

  create(data: { title: string; image_url?: string; link_url?: string; branch_id: string; sort_order?: number }): Observable<Ad> {
    return this.post<Ad>(API_CONFIG.endpoints.ads.create, data);
  }

  update(id: string, data: { title?: string; image_url?: string; link_url?: string; is_active?: boolean; sort_order?: number }): Observable<Ad> {
    return this.patch<Ad>(buildUrl(API_CONFIG.endpoints.ads.update, { id }), data);
  }

  remove(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.ads.delete, { id }));
  }
}
