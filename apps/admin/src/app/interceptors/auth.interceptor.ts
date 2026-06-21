import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log('[Auth Interceptor] URL:', req.url);
  console.log('[Auth Interceptor] Token found:', !!token);
  console.log('[Auth Interceptor] Token preview:', token?.substring(0, 30));
  console.log('[Auth Interceptor] localStorage keys:', Object.keys(localStorage));
  if (token) {
    const clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    console.log('[Auth Interceptor] Auth header set:', clonedReq.headers.get('Authorization')?.substring(0, 50));
    return next(clonedReq);
  }
  console.log('[Auth Interceptor] No token, sending request without auth');
  return next(req);
};