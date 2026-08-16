import { HttpErrorResponse } from '@angular/common/http';
import { handleApiError, isNetworkError, NETWORK_ERROR_MESSAGE } from './api-error';

describe('handleApiError', () => {
  it('uses friendly message for network failures (status 0, no body)', () => {
    const err = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://test/api/v1/tabs',
    });
    expect(isNetworkError(err)).toBe(true);
    const result: any = handleApiError(err);
    result.subscribe({
      error: (apiError: any) => {
        expect(apiError.message).toBe(NETWORK_ERROR_MESSAGE);
        expect(apiError.serverMessage).toBe(NETWORK_ERROR_MESSAGE);
        expect(apiError.statusCode).toBe(0);
      },
    });
  });

  it('classifies non-network client errors as server errors', () => {
    const err = new HttpErrorResponse({
      error: { message: 'Boom' },
      status: 500,
      statusText: 'Internal Server Error',
      url: 'https://test/api/v1/x',
    });
    const result: any = handleApiError(err);
    result.subscribe({
      error: (apiError: any) => {
        expect(apiError.serverMessage).toBe('Boom');
        expect(apiError.statusCode).toBe(500);
        expect(apiError.serverMessage).not.toBe(NETWORK_ERROR_MESSAGE);
      },
    });
  });
});