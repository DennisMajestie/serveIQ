import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { RegisterRequest, RegisterResponse } from '@serveiq/shared/models';

export interface AuthResponse {
  success: boolean;
  data: {
    access_token: string;
    user?: any;
    business?: {
      id: string;
      name: string;
    };
    branch?: {
      id: string;
      name: string;
    };
    businessId?: string;
    businessName?: string;
    branchId?: string;
  };
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('token')
  );
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) private env: EnvironmentConfig
  ) {}

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, {
      email, password
    }).pipe(
      tap(response => {
        const token = response.data?.access_token;
        if (token) {
          localStorage.setItem('token', token);
          
          const branchId = response.data.branch?.id || 
                           response.data.branchId || 
                           response.data.user?.branch?.id || 
                           response.data.user?.branch;
          
          const businessId = response.data.business?.id || 
                             response.data.businessId || 
                             response.data.user?.business?.id || 
                             response.data.user?.business;

          if (branchId && branchId !== 'default-branch') {
            localStorage.setItem('branchId', branchId);
          }
          if (businessId) {
            localStorage.setItem('businessId', businessId);
          }

          this.tokenSubject.next(token);
        }
      })
    );
  }

  /** Activate a terminal device using Admin credentials */
  activateTerminal(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/activate`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(response => {
        const token = response.data?.access_token;
        // In the new NestJS API, the structure is { success: true, business: {...}, branch: {...}, user: {...} }
        // or for staff login it's { access_token: "...", user: {...} }
        
        const resData = response.data as any;
        const businessId = resData.business?.id || resData.businessId || resData.user?.business;
        const businessName = resData.business?.name || resData.businessName || '';
        const branchId = resData.branch?.id || resData.branchId || resData.user?.branch;

        if (businessId) localStorage.setItem('businessId', businessId);
        if (businessName) localStorage.setItem('businessName', businessName);
        if (branchId && branchId !== 'default-branch') localStorage.setItem('branchId', branchId);
        
        if (token) {
          localStorage.setItem('token', token);
          this.tokenSubject.next(token);
        }
      })
    );
  }

  /** Verify a staff member's PIN for an activated terminal */
  verifyStaffPin(pin: string, businessId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/waiter-login`, { pin, businessId }
    ).pipe(
      tap(response => {
        const token = response.data?.access_token;
        const resData = response.data as any;
        const branchId = resData.user?.branch || resData.branchId || resData.branch?.id;
        if (token) {
          localStorage.setItem('staffToken', token);
        }
        if (branchId && branchId !== 'default-branch') {
          localStorage.setItem('branchId', branchId);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/api/v1/auth/register`, data);
  }

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/api/v1/upload`, formData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    localStorage.removeItem('staffToken');
    this.tokenSubject.next(null);
  }
}
