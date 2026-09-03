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
  logoUrl?: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  taxRate?: number;
  serviceChargePercent?: number;
  items: PublicMenuItem[];
}

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  address?: string;
  logoUrl?: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  branchCount: number;
  createdAt?: Date;
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

  getBusinesses(): Observable<PublicBusiness[]> {
    const url = `${this.env.apiUrl}${API_CONFIG.endpoints.publicBusinesses}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) {
          data = data.data;
        }
        if (!Array.isArray(data)) {
          return [];
        }
        return data.map((item: any) => snakeToCamel<PublicBusiness>(item));
      })
    );
  }
}
