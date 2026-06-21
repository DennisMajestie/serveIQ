import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('!!! INTERCEPTOR START !!! URL:', req.url);
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  console.log('!!! INTERCEPTOR TOKEN !!!', !!token);
  
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('!!! INTERCEPTOR ATTACHED !!!');
    return next(authReq);
  }
  
  console.warn('!!! INTERCEPTOR NO TOKEN !!!');
  return next(req);
};