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
    business?: any;
    branch?: any;
    businessId?: string;
    businessName?: string;
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
          this.tokenSubject.next(token);
        }
      })
    );
  }

  /** Activate a terminal device and link it to a business (Admin only) */
  activateTerminal(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/activate`, { email, password }
    ).pipe(
      tap(response => {
        const token = response.data?.access_token;
        if (token) {
          localStorage.setItem('businessId', response.data.businessId || response.data.business?.id || '');
          localStorage.setItem('businessName', response.data.businessName || response.data.business?.name || '');
          localStorage.setItem('token', token);
          this.tokenSubject.next(token);
        }
      })
    );
  }

  /** Verify a staff member's PIN for an activated terminal */
  verifyStaffPin(pin: string, businessId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/staff-login`, { pin, businessId }
    ).pipe(
      tap(response => {
        const token = response.data?.access_token;
        if (token) {
          localStorage.setItem('staffToken', token);
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
