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
      } else if (body.error?.message) {
        serverMessage = body.error.message;
      } else if (typeof body.error === 'string') {
        serverMessage = body.error;
      }
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
