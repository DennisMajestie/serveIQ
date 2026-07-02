import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { RegisterRequest, RegisterResponse, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest } from '@serveiq/shared/models';

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

/** Read staffToken from sessionStorage first, then localStorage (legacy fallback). */
function getStaffToken(): string | null {
  return sessionStorage.getItem('staffToken') || localStorage.getItem('staffToken');
}

/** Write staffToken to sessionStorage (per-tab isolation). */
function setStaffToken(token: string): void {
  sessionStorage.setItem('staffToken', token);
}

/** Remove staffToken from both storages. */
function removeStaffToken(): void {
  sessionStorage.removeItem('staffToken');
  localStorage.removeItem('staffToken');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(
    getStaffToken() || localStorage.getItem('token')
  );
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) private env: EnvironmentConfig
  ) {}

  get isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') || getStaffToken());
  }

  isLoggedIn(): boolean {
    return !!(localStorage.getItem('token') || getStaffToken());
  }

  getToken(): string | null {
    return getStaffToken() || localStorage.getItem('token');
  }

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, {
      email, password
    }).pipe(
      tap((response: any) => {
        const token = response.access_token || response.data?.access_token;
        if (token) {
          localStorage.setItem('token', token);

          const data = response.data || response;
          const branchId = data.branch?.id ||
                           data.branchId ||
                           data.user?.branch?.id ||
                           data.user?.branch ||
                           data.user?.branch_id;
          
          const businessId = data.business?.id ||
                             data.businessId ||
                             data.user?.business?.id ||
                             data.user?.business ||
                             data.user?.business_id;

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
          setStaffToken(token);
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

  /** Refresh the access token using the refresh token */
  refreshToken(): Observable<AuthResponse> {
    const currentToken = getStaffToken() || localStorage.getItem('token');
    const isStaff = !!getStaffToken();
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/refresh`, {}).pipe(
      tap(response => {
        const token = response.data?.access_token;
        if (token) {
          if (isStaff) {
            setStaffToken(token);
          } else {
            localStorage.setItem('token', token);
          }
          this.tokenSubject.next(token);
        }
      })
    );
  }

  serverLogout(): Observable<void> {
    const refreshToken = getStaffToken() || localStorage.getItem('token') || '';
    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/logout`, { refresh_token: refreshToken });
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/api/v1/auth/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/reset-password`, data);
  }

  sendVerification(): Observable<{ otp: string }> {
    return this.http.post<{ otp: string }>(`${this.apiUrl}/api/v1/auth/send-verification`, {});
  }

  verifyEmail(data: VerifyEmailRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/verify-email`, data);
  }

  logout() {
    localStorage.removeItem('token');
    removeStaffToken();
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    this.tokenSubject.next(null);
    this.serverLogout().subscribe({ error: () => {} });
    window.location.href = '/login';
  }
}
