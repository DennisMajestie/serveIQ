import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  businessType: string;
  logoUrl?: string;
  cacDocumentUrl?: string;
}

export interface RegisterResponse {
  business: any;
  owner: any;
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

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, {
      email, password
    }).pipe(
      tap(response => {
        localStorage.setItem('token', response.accessToken);
        this.tokenSubject.next(response.accessToken);
      })
    );
  }

  /** Activate a terminal device and link it to a business (Admin only) */
  activateTerminal(email: string, password: string): Observable<{ businessId: string; businessName: string }> {
    return this.http.post<{ businessId: string; businessName: string; accessToken: string }>(
      `${this.apiUrl}/api/v1/auth/activate`, { email, password }
    ).pipe(
      tap(response => {
        localStorage.setItem('businessId', response.businessId);
        localStorage.setItem('businessName', response.businessName);
        localStorage.setItem('token', response.accessToken);
        this.tokenSubject.next(response.accessToken);
      })
    );
  }

  /** Verify a staff member's PIN for an activated terminal */
  verifyStaffPin(pin: string, businessId: string): Observable<{ user: any; accessToken: string }> {
    return this.http.post<{ user: any; accessToken: string }>(
      `${this.apiUrl}/api/v1/auth/staff-login`, { pin, businessId }
    ).pipe(
      tap(response => {
        localStorage.setItem('staffToken', response.accessToken);
        // We keep the businessId/accessToken separate from the staff session
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
    this.tokenSubject.next(null);
  }
}
