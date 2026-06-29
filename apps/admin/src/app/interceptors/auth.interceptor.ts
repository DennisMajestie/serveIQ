import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const staffToken = localStorage.getItem('staffToken');
  const activeToken = staffToken || token;

  if (activeToken) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${activeToken}` }
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('businessId');
          localStorage.removeItem('businessName');
          window.location.href = '/login';
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
