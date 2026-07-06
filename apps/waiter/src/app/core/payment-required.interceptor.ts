import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

export const paymentRequiredInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 402) {
        Swal.fire({
          icon: 'warning',
          title: 'Subscription Expired',
          text: 'Your subscription has expired. Please contact your account administrator to renew.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f97316',
        }).then(() => router.navigate(['/tables']));
      }
      return throwError(() => error);
    })
  );
};
