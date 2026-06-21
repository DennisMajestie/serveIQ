import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  console.log('[Auth Interceptor] Intercepting request:', req.url);
  console.log('[Auth Interceptor] Token found:', !!token);
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('[Auth Interceptor] Authorization header attached');
    return next(authReq);
  }
  
  console.warn('[Auth Interceptor] No token found in localStorage');
  return next(req);
};