import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginResponse, WaiterLoginResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap(res => localStorage.setItem('token', res.accessToken))
    );
  }

  register(payload: { fullName: string; email: string; password: string; businessName: string; businessType: string; logoUrl?: string; cacDocumentUrl?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, payload);
  }

  waiterLogin(pin: string, branchId: string): Observable<WaiterLoginResponse> {
    return this.http.post<WaiterLoginResponse>(`${this.baseUrl}/auth/waiter-login`, { pin, branchId }).pipe(
      tap(res => localStorage.setItem('token', res.access_token))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
