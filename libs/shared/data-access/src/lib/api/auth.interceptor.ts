import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

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

const SUBSCRIPTION_ROUTES = ['/billing'];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (AUTH_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
      return next.handle(request);
    }

    const token = this.authService.getToken();
    request = request.clone({ withCredentials: true });

    if (token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && token) {
          if (this.isRefreshing) {
            return this.refreshTokenSubject.pipe(
              filter(t => t !== null),
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

          this.isRefreshing = true;
          this.refreshTokenSubject.next(null);

          return this.authService.refreshToken().pipe(
            tap(() => {
              const newToken = this.authService.getToken();
              this.refreshTokenSubject.next(newToken || '');
            }),
            switchMap(() => {
              this.isRefreshing = false;
              const newToken = this.authService.getToken();
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
              this.refreshTokenSubject.next('');
              this.authService.logout();
              return throwError(() => error);
            })
          );
        }
        if (error.status === 402) {
          const currentUrl = window.location.pathname;
          const isSubscriptionRoute = SUBSCRIPTION_ROUTES.some(r => currentUrl.startsWith(r));
          if (!isSubscriptionRoute) {
            window.location.href = '/billing';
          }
        }
        return throwError(() => error);
      })
    );
  }
}
