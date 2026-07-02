import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
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
          // Only attempt refresh if we have a token and not already refreshing
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
              tap(() => {
                this.isRefreshing = false;
                const newToken = localStorage.getItem('staffToken') || localStorage.getItem('token');
                this.refreshTokenSubject.next(newToken);
              }),
              switchMap(() => {
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
                this.authService.logout();
                return throwError(() => error);
              })
            );
          } else {
            // Wait for refresh;
            // Another request is already refreshing, wait for it
            return this.refreshTokenSubject.pipe(
              filter(token => token !== null),
              take(1),
              switchMap(newToken => {
                const retryRequest = request.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next.handle(retryRequest);
              })
            );
          }
        }
        return throwError(() => error);
      })
    );
  }
}
