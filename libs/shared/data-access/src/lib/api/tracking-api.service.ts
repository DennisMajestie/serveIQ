import { Inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { snakeToCamel, Order } from '@serveiq/shared/models';

export interface TrackingData {
  order: Order;
  businessName: string;
  branchName: string;
  logoUrl?: string;
  branchId: string;
  paymentAccountNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private http: HttpClient;
  private env: EnvironmentConfig;

  constructor(httpBackend: HttpBackend, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    this.http = new HttpClient(httpBackend);
    this.env = env;
  }

  getTracking(code: string): Observable<TrackingData> {
    const url = `${this.env.apiUrl}${buildUrl(API_CONFIG.endpoints.publicTracking, { code })}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        while (data && typeof data === 'object' && 'data' in data) {
          data = data.data;
        }
        return snakeToCamel<TrackingData>(data);
      })
    );
  }
}
