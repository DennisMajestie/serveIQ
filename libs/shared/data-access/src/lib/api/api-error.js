import { throwError } from 'rxjs';
// Error Handler Function
export function handleApiError(error) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
    }
    else {
        // Server-side error
        errorMessage = `Server Error ${error.status}: ${error.message || error.statusText}`;
    }
    console.error('API Error:', {
        status: error.status,
        message: errorMessage,
        details: error.error,
    });
    return throwError(() => ({
        message: errorMessage,
        statusCode: error.status,
        details: error.error,
        timestamp: new Date().toISOString(),
    }));
}
//# sourceMappingURL=api-error.js.map