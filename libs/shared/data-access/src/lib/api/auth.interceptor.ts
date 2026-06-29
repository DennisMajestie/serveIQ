import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
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
        if (error.status === 401) {
          // Try to refresh token before logging out
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const activeToken = localStorage.getItem('token') || localStorage.getItem('staffToken');
              if (activeToken) {
                const retryRequest = request.clone({
                  setHeaders: { Authorization: `Bearer ${activeToken}` }
                });
                return next.handle(retryRequest);
              }
              this.authService.logout();
              return throwError(() => error);
            }),
            catchError(() => {
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
