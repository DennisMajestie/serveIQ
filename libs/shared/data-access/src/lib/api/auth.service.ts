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

let _adminToken: string | null = null;
let _staffToken: string | null = null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) private env: EnvironmentConfig
  ) {}

  get isAuthenticated(): boolean {
    return !!(this.getToken());
  }

  isLoggedIn(): boolean {
    return !!(this.getToken());
  }

  getToken(): string | null {
    return _staffToken || _adminToken;
  }

  setToken(token: string): void {
    _adminToken = token;
    this.tokenSubject.next(token);
  }

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, {
      email, password
    }, { withCredentials: true }).pipe(
      tap((response: any) => {
        const data = response.data || response;
        const token = data.access_token || data.token || response.access_token || response.token;
        if (token) {
          _adminToken = token;

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

          let userRole = data.user?.role || data.role;
          if (userRole === 'superadmin') userRole = 'super_admin';
          if (userRole) {
            localStorage.setItem('userRole', userRole);
          }

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

  /** Resolve a business code to get business ID and name */
  resolveBusinessCode(code: string): Observable<{ business_id: string; business_name: string }> {
    return this.http.post<{ business_id: string; business_name: string }>(
      `${this.apiUrl}/api/v1/auth/resolve-business`,
      { business_code: code }
    );
  }

  /** Activate a terminal device using Admin credentials */
  activateTerminal(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/activate`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    ).pipe(
      tap((response: any) => {
        const resData = response.data || response;
        const token = resData.access_token || resData.token || response.access_token || response.token;
        
        const businessId = resData.business?.id || resData.businessId || resData.user?.business;
        const businessName = resData.business?.name || resData.businessName || '';
        const branchId = resData.branch?.id || resData.branchId || resData.user?.branch;

        const userRole = resData.user?.role || resData.role;
        const normalizedRole = userRole === 'superadmin' ? 'super_admin' : userRole;

        if (businessId) localStorage.setItem('businessId', businessId);
        if (businessName) localStorage.setItem('businessName', businessName);
        if (branchId && branchId !== 'default-branch') localStorage.setItem('branchId', branchId);
        if (normalizedRole) localStorage.setItem('userRole', normalizedRole);
        
        if (token) {
          _adminToken = token;
          this.tokenSubject.next(token);
        }
      })
    );
  }

  /** Verify a staff member's PIN for an activated terminal */
  verifyStaffPin(pin: string, businessId: string): Observable<AuthResponse> {
    const branchId = localStorage.getItem('branchId');
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/api/v1/auth/waiter-login`, { pin, business_id: businessId, branch_id: branchId || undefined },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        const resData = response.data || response;
        const token = resData.access_token || resData.token || response.access_token || response.token;
        const branchId = resData.user?.branch || resData.branchId || resData.branch?.id;
        const userRole = resData.user?.role || resData.role || '';
        const normalizedRole = userRole === 'superadmin' ? 'super_admin' : userRole;
        if (token) {
          _staffToken = token;
          this.tokenSubject.next(token);
        }
        if (branchId && branchId !== 'default-branch') {
          localStorage.setItem('branchId', branchId);
        }
        localStorage.setItem('userRole', normalizedRole || 'staff');
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
    const currentToken = this.getToken();
    const isStaff = !!_staffToken;
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/refresh`, { refresh_token: currentToken }, { withCredentials: true }).pipe(
      tap(response => {
        const token = response.data?.access_token;
        if (token) {
          if (isStaff) {
            _staffToken = token;
          } else {
            _adminToken = token;
          }
          this.tokenSubject.next(token);
        }
      })
    );
  }

  serverLogout(): Observable<void> {
    const refreshToken = this.getToken() || '';
    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/logout`, { refresh_token: refreshToken }, { withCredentials: true });
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

  impersonate(businessId: string, branchId?: string, businessName?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/impersonate`, { businessId, branchId }, { withCredentials: true }).pipe(
      tap((response: any) => {
        const data = response.data || response;
        const token = data.access_token || data.token || response.access_token || response.token;
        if (token) {
          const currentToken = _adminToken;
          if (currentToken) localStorage.setItem('originalToken', currentToken);
          localStorage.setItem('originalBusinessId', localStorage.getItem('businessId') || '');
          localStorage.setItem('originalBranchId', localStorage.getItem('branchId') || '');
          localStorage.setItem('originalUserRole', localStorage.getItem('userRole') || '');

          _adminToken = token;
          localStorage.setItem('businessId', businessId);
          const responseBranchId = data.branchId;
          if (responseBranchId) {
            localStorage.setItem('branchId', responseBranchId);
          } else {
            localStorage.removeItem('branchId');
          }
          localStorage.setItem('impersonating', businessName || 'true');
          localStorage.setItem('userRole', 'owner');
          this.tokenSubject.next(token);
        }
      })
    );
  }

  stopImpersonating(): void {
    const originalToken = localStorage.getItem('originalToken');
    const originalBusinessId = localStorage.getItem('originalBusinessId');
    const originalBranchId = localStorage.getItem('originalBranchId');
    const originalUserRole = localStorage.getItem('originalUserRole');

    if (originalToken) {
      _adminToken = originalToken;
      this.tokenSubject.next(originalToken);
    }
    if (originalBusinessId) localStorage.setItem('businessId', originalBusinessId);
    if (originalBranchId) localStorage.setItem('branchId', originalBranchId);
    const roleToRestore = originalUserRole || 'super_admin';
    localStorage.setItem('userRole', roleToRestore);

    localStorage.removeItem('originalToken');
    localStorage.removeItem('originalBusinessId');
    localStorage.removeItem('originalBranchId');
    localStorage.removeItem('originalUserRole');
    localStorage.removeItem('impersonating');
  }

  isImpersonating(): boolean {
    return !!localStorage.getItem('impersonating');
  }

  logout() {
    _adminToken = null;
    _staffToken = null;
    localStorage.removeItem('userRole');
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    this.tokenSubject.next(null);
    this.serverLogout().subscribe({ error: () => {} });
    window.location.href = '/login';
  }
}
