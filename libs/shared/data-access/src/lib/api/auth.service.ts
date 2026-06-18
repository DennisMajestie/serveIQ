import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { API_CONFIG } from './api.config';

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

  constructor(private http: HttpClient) {}

  get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}/api/v1/auth/login`, {
      email, password
    }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
        this.tokenSubject.next(response.accessToken);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_CONFIG.baseUrl}/api/v1/auth/register`, data);
  }

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.upload}`, formData);
  }

  logout() {
    localStorage.removeItem('accessToken');
    this.tokenSubject.next(null);
  }
}
