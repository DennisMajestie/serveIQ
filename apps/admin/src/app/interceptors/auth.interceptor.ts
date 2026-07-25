import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const SUBSCRIPTION_ROUTES = ['/billing'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const router = inject(Router);

  let clonedReq = req.clone({ withCredentials: true });
  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
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
};
