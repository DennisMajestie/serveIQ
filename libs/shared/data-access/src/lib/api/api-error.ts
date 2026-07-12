import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

// Standard API Error Response Interface
export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
  serverMessage?: string;
  timestamp: string;
}

// Error Handler Function
export function handleApiError(error: HttpErrorResponse): Observable<never> {
  let errorMessage = 'An unknown error occurred';
  let serverMessage: string | undefined;

  if (error.error instanceof ErrorEvent) {
    errorMessage = `Client Error: ${error.error.message}`;
  } else {
    errorMessage = `Server Error ${error.status}: ${error.message || error.statusText}`;
    const body = error.error;
      if (body) {
        if (typeof body === 'string') {
          serverMessage = body;
        } else if (body.message) {
          serverMessage = body.message;
        } else if (body.detail) {
          serverMessage = body.detail;
        } else if (body.error?.message) {
          serverMessage = body.error.message;
        } else if (typeof body.error === 'string') {
          serverMessage = body.error;
        } else if (body.meta?.message) {
          const msg = body.meta.message;
          serverMessage = Array.isArray(msg) ? msg[0] : msg;
        } else if (Array.isArray(body.errors) && body.errors.length > 0) {
          const first = body.errors[0];
          serverMessage = typeof first === 'string' ? first : first.message || first.detail || first.msg;
        } else if (typeof body === 'object') {
          const vals = Object.values(body);
          const strVal = vals.find(v => typeof v === 'string');
          if (strVal) serverMessage = strVal;
        }
      }
      if (!serverMessage) {
        console.error('Raw server error body:', JSON.stringify(error.error));
      }
  }

  console.error('API Error:', {
    status: error.status,
    message: errorMessage,
    serverMessage,
    details: error.error,
  });

  return throwError(() => ({
    message: errorMessage,
    statusCode: error.status,
    serverMessage,
    details: error.error,
    timestamp: new Date().toISOString(),
  } as ApiError));
}
