import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { handleApiError } from './api-error';
import { snakeToCamel } from '@serveiq/shared/models';

export type MoniepointEnvironment = 'SANDBOX' | 'PROD';
export type MoniepointErpPushStatus =
  | 'pending'
  | 'paid'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface MoniepointErpCredential {
  id: string;
  branchId: string;
  environment: MoniepointEnvironment;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MoniepointErpCredentialView {
  enrolled: boolean;
  credential: MoniepointErpCredential | null;
}

export interface MoniepointErpPush {
  id: string;
  billId: string | null;
  merchantReference: string;
  terminalSerial: string;
  amountKobo: number;
  status: MoniepointErpPushStatus;
  error: string | null;
  pushedAt?: string;
  paidAt?: string | null;
  duplicate?: boolean;
  settled?: boolean;
}

export interface MoniepointErpPushResult {
  pushed: boolean;
  push: MoniepointErpPush;
}

export interface MoniepointErpPushList {
  pushes: MoniepointErpPush[];
}

export interface EnrollMoniepointErpRequest {
  clientId: string;
  clientSecret: string;
  environment?: MoniepointEnvironment;
  isActive?: boolean;
}

export interface UpdateMoniepointErpRequest {
  clientSecret?: string;
  environment?: MoniepointEnvironment;
  isActive?: boolean;
}

export interface PushMoniepointErpRequest {
  terminalSerial: string;
  amount: number;
  billId?: string;
  merchantReference?: string;
  paymentMethod?: 'CARD_PURCHASE' | 'POS_TRANSFER' | 'ANY';
}

/**
 * Moniepoint ERP (Channel) push-payment client.
 *
 * These endpoints are served by the backend's /moniepoint/erp module and are
 * scoped to the authenticated branch. The requests MUST keep camelCase field
 * names (clientId, billId, terminalSerial), so we use raw HttpClient calls
 * instead of BaseApiService.post/patch (which camelToSnake the body) while
 * keeping the same { success, data } unwrap + snakeToCamel response mapping.
 */
@Injectable({ providedIn: 'root' })
export class MoniepointErpApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  getCredential(): Observable<MoniepointErpCredentialView> {
    return this.getRaw<MoniepointErpCredentialView>(
      API_CONFIG.endpoints.moniepointErp.credential
    );
  }

  enroll(data: EnrollMoniepointErpRequest): Observable<MoniepointErpCredentialView> {
    return this.postRaw<MoniepointErpCredentialView>(
      API_CONFIG.endpoints.moniepointErp.credential,
      data
    );
  }

  update(data: UpdateMoniepointErpRequest): Observable<MoniepointErpCredentialView> {
    return this.patchRaw<MoniepointErpCredentialView>(
      API_CONFIG.endpoints.moniepointErp.credential,
      data
    );
  }

  push(data: PushMoniepointErpRequest): Observable<MoniepointErpPushResult> {
    return this.postRaw<MoniepointErpPushResult>(
      API_CONFIG.endpoints.moniepointErp.push,
      data
    );
  }

  listPushes(filter: {
    billId?: string;
    status?: MoniepointErpPushStatus;
  } = {}): Observable<MoniepointErpPushList> {
    const params: Record<string, string> = {};
    if (filter.billId) params['billId'] = filter.billId;
    if (filter.status) params['status'] = filter.status;
    return this.getRaw<MoniepointErpPushList>(
      API_CONFIG.endpoints.moniepointErp.pushes,
      params
    );
  }

  private getRaw<T>(
    path: string,
    queryParams?: Record<string, string>
  ): Observable<T> {
    let httpParams = new HttpParams();
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value === undefined || value === null || value === '') continue;
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http
      .get<any>(`${this.apiUrl}${path}`, {
        headers: this.defaultHeaders,
        params: httpParams,
      })
      .pipe(
        map((res) => this.unwrap<T>(res)),
        catchError(handleApiError)
      );
  }

  private postRaw<T>(path: string, body: any): Observable<T> {
    return this.http
      .post<any>(`${this.apiUrl}${path}`, body, {
        headers: this.defaultHeaders,
      })
      .pipe(
        map((res) => this.unwrap<T>(res)),
        catchError(handleApiError)
      );
  }

  private patchRaw<T>(path: string, body: any): Observable<T> {
    return this.http
      .patch<any>(`${this.apiUrl}${path}`, body, {
        headers: this.defaultHeaders,
      })
      .pipe(
        map((res) => this.unwrap<T>(res)),
        catchError(handleApiError)
      );
  }

  private unwrap<T>(res: any): T {
    let data = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return snakeToCamel<T>(data);
  }
}