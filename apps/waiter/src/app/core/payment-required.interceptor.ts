import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const paymentRequiredInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 402) {
        // SweetAlert2 is imported lazily. This interceptor is registered in the
        // eager provider chain, so a static import here pulled the whole dialog
        // library into the initial bundle. A 402 is already a failure path, so
        // fetching the chunk here costs nothing perceptible. The catch keeps the
        // redirect working even if the chunk cannot be fetched.
        void import('sweetalert2')
          .then(({ default: Swal }) =>
            Swal.fire({
              icon: 'warning',
              title: 'Subscription Expired',
              text: 'Your subscription has expired. Please contact your account administrator to renew.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f97316',
            }).then(() => router.navigate(['/tables'])),
          )
          .catch(() => router.navigate(['/tables']));
      }
      return throwError(() => error);
    })
  );
};
