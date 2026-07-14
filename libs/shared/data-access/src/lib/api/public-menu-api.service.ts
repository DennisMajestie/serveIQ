import { Inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { snakeToCamel } from '@serveiq/shared/models';

export interface PublicMenuItem {
  id: string;
  name: string;
  category: string;
  priceKobo: number;
  description?: string;
  imageUrl?: string;
  isSoldOut: boolean;
}

export interface PublicMenuData {
  businessName: string;
  branchName: string;
  items: PublicMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class PublicMenuApiService {
  private http: HttpClient;
  private env: EnvironmentConfig;

  constructor(httpBackend: HttpBackend, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    this.http = new HttpClient(httpBackend);
    this.env = env;
  }

  getMenu(branchId: string): Observable<PublicMenuData> {
    const url = `${this.env.apiUrl}${buildUrl(API_CONFIG.endpoints.publicMenu, { branchId })}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) {
          data = data.data;
        }
        return snakeToCamel<PublicMenuData>(data);
      })
    );
  }
}
