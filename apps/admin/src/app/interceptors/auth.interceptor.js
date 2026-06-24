export const authInterceptor = (req, next) => {
    const token = localStorage.getItem('token');
    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }
    else {
        console.warn('[AuthInterceptor] No token found in localStorage');
    }
    return next(req);
};
//# sourceMappingURL=auth.interceptor.js.map