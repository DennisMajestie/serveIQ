import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ENVIRONMENT_CONFIG } from './environment.token';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'https://test-api.com' } },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send login request and store token', () => {
      service.login('test@test.com', 'password123').subscribe(() => {
        expect(service.getToken()).toBe('test-token-123');
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password123' });
      req.flush({ data: { access_token: 'test-token-123' } });
    });

    it('should store branchId and businessId from response', () => {
      service.login('test@test.com', 'pass').subscribe(() => {
        expect(localStorage.getItem('branchId')).toBe('branch-1');
        expect(localStorage.getItem('businessId')).toBe('biz-1');
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/auth/login');
      req.flush({
        data: {
          access_token: 'token',
          branch: { id: 'branch-1' },
          business: { id: 'biz-1' },
        },
      });
    });

    it('should store user role', () => {
      service.login('admin@test.com', 'pass').subscribe(() => {
        expect(localStorage.getItem('userRole')).toBe('super_admin');
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/auth/login');
      req.flush({ data: { access_token: 'token', user: { role: 'superadmin' } } });
    });

    it('should handle login error', () => {
      service.login('bad@test.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('resolveBusinessCode', () => {
    it('should send business code and return business info', () => {
      service.resolveBusinessCode('ABC123').subscribe((res) => {
        expect(res.business_id).toBe('biz-1');
        expect(res.business_name).toBe('Test Restaurant');
      });

      const req = httpMock.expectOne('https://test-api.com/api/v1/auth/resolve-business');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ business_code: 'ABC123' });
      req.flush({ business_id: 'biz-1', business_name: 'Test Restaurant' });
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(service.isAuthenticated).toBe(false);
    });

    it('should return true when token exists', () => {
      service.setToken('some-token');
      expect(service.isAuthenticated).toBe(true);
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the stored token', () => {
      service.setToken('test-token');
      expect(service.getToken()).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('should clear tokens and notify subscribers', () => {
      service.setToken('some-token');
      const tokenValues: (string | null)[] = [];
      service.token$.subscribe(v => tokenValues.push(v));

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(tokenValues).toContain(null);
    });
  });
});
