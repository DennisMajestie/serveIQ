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
    localStorage.getItem('accessToken')
  );
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) private env: EnvironmentConfig
  ) {}

  get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  private get apiUrl(): string {
    return this.env.apiUrl;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, {
      email, password
    }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
        this.tokenSubject.next(response.accessToken);
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
    localStorage.removeItem('accessToken');
    this.tokenSubject.next(null);
  }
}
