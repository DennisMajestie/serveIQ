import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BaseApiService } from './base-api.service';
import { ENVIRONMENT_CONFIG } from './environment.token';

describe('BaseApiService', () => {
  let service: BaseApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BaseApiService,
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'https://test-api.com' } },
      ],
    });

    service = TestBed.inject(BaseApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('get', () => {
    it('should unwrap success.data envelope', () => {
      service.get('/api/v1/test').subscribe((data: any) => {
        expect(data).toEqual({ id: '1', name: 'Test' });
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/test');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { id: '1', name: 'Test' } });
    });

    it('should convert snake_case response to camelCase', () => {
      service.get('/api/v1/items').subscribe((data: any) => {
        expect(data.helloWorld).toBe('value');
        expect(data.hello_world).toBeUndefined();
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/items');
      req.flush({ success: true, data: { hello_world: 'value' } });
    });

    it('should pass query params', () => {
      service.get('/api/v1/items', undefined, { page: '1', per_page: '10' }).subscribe();

      const req = httpMock.expectOne(r => r.url === 'https://test-api.com/api/v1/items');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('per_page')).toBe('10');
      req.flush({ success: true, data: [] });
    });

    it('should handle errors', () => {
      service.get('/api/v1/error').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/error');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('post', () => {
    it('should send POST with body', () => {
      const body = { name: 'New Item' };
      service.post('/api/v1/items', body).subscribe((data: any) => {
        expect(data).toEqual({ id: '1', name: 'New Item' });
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/items');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true, data: { id: '1', name: 'New Item' } });
    });
  });

  describe('patch', () => {
    it('should send PATCH with body', () => {
      const body = { name: 'Updated' };
      service.patch('/api/v1/items/1', body).subscribe();

      const req = httpMock.expectOne('https://test-api.com/api/v1/items/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true, data: {} });
    });
  });

  describe('delete', () => {
    it('should send DELETE request', () => {
      service.delete('/api/v1/items/1').subscribe();

      const req = httpMock.expectOne('https://test-api.com/api/v1/items/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: {} });
    });
  });
});
