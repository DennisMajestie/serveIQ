import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Skip interceptor for auth endpoints to avoid recursion during refresh/logout
const AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/staff-login',
  '/api/v1/auth/waiter-login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/send-verification',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/activate',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip interceptor for auth endpoints
    if (AUTH_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
      return next.handle(request);
    }

    const staffToken = localStorage.getItem('staffToken');
    const token = localStorage.getItem('token');
    
    // Prioritize staff token for waiter operations, then fallback to admin/terminal token
    const activeToken = staffToken || token;

    if (activeToken) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${activeToken}` }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && activeToken) {
          if (this.isRefreshing) {
            // Another request is already refreshing, wait for it
            return this.refreshTokenSubject.pipe(
              filter(token => token !== null),
              take(1),
              switchMap(newToken => {
                if (!newToken) {
                  this.authService.logout();
                  return throwError(() => error);
                }
                const retryRequest = request.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next.handle(retryRequest);
              })
            );
          }

          // First 401 — attempt token refresh
          this.isRefreshing = true;
          this.refreshTokenSubject.next(null);

          return this.authService.refreshToken().pipe(
            tap(() => {
              const newToken = localStorage.getItem('staffToken') || localStorage.getItem('token');
              this.refreshTokenSubject.next(newToken || '');
            }),
            switchMap(() => {
              this.isRefreshing = false;
              const newToken = localStorage.getItem('staffToken') || localStorage.getItem('token');
              if (newToken) {
                const retryRequest = request.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next.handle(retryRequest);
              }
              this.authService.logout();
              return throwError(() => error);
            }),
            catchError(() => {
              this.isRefreshing = false;
              // Unblock queued requests with empty token so they fail fast
              this.refreshTokenSubject.next('');
              this.authService.logout();
              return throwError(() => error);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
