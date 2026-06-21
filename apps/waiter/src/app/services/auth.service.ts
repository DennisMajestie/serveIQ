import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  waiterLogin(pin: string, branchId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/waiter-login`, { pin, branchId }).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('businessId', branchId);
      })
    );
  }

  activateTerminal(email: string, password: string): Observable<{ businessId: string; businessName: string }> {
    return this.http.post<{ businessId: string; businessName: string; accessToken: string }>(
      `${this.baseUrl}/api/v1/auth/activate`, { email, password }
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('businessId');
    this.router.navigate(['/login']);
  }
}
