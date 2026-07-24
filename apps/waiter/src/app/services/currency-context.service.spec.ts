import { TestBed } from '@angular/core/testing';
import { CurrencyContextService } from './currency-context.service';
import { BusinessApiService } from '@serveiq/shared/data-access';
import { of } from 'rxjs';

describe('CurrencyContextService', () => {
  let service: CurrencyContextService;
  let mockBusinessApi: any;

  beforeEach(() => {
    mockBusinessApi = { getBusiness: vi.fn() };
    mockBusinessApi.getBusiness.mockReturnValue(of({ currency: 'USD' }));

    TestBed.configureTestingModule({
      providers: [
        CurrencyContextService,
        { provide: BusinessApiService, useValue: mockBusinessApi },
      ],
    });

    service = TestBed.inject(CurrencyContextService);
  });

  it('should load currency from business API', () => {
    expect(service.getSymbol()).toBe('$');
    expect(service.getCode()).toBe('USD');
    expect(service.getName()).toBe('US Dollar');
  });

  it('should format kobo to currency string', () => {
    expect(service.formatKobo(10000)).toContain('100');
    expect(service.formatKobo(10500)).toContain('105');
    expect(service.formatKobo(0)).toContain('0');
  });

  it('should format plain numbers without currency symbol', () => {
    const result = service.formatPlain(100);
    expect(result).not.toContain('₦');
    expect(result).not.toContain('$');
    expect(parseFloat(result.replace(/,/g, ''))).toBe(100);
  });

  it('should switch currency code', () => {
    service.setCurrency('EUR');
    expect(service.getSymbol()).toBe('€');
    expect(service.getCode()).toBe('EUR');
    expect(service.getName()).toBe('Euro');
  });

  it('should fallback to NGN for unknown currency', () => {
    service.setCurrency('XYZ');
    expect(service.getCode()).toBe('NGN');
  });

  it('should format kobo correctly per currency', () => {
    service.setCurrency('GBP');
    const result = service.formatKobo(25000);
    expect(result).toContain('250');
  });

  it('should formatAmount with currency symbol from API', () => {
    const result = service.formatAmount(100);
    expect(result).toContain('$');
  });

  it('should formatNaira equal formatPlain', () => {
    expect(service.formatNaira(500)).toBe(service.formatPlain(500));
  });

  it('should be marked loaded after construction', () => {
    expect(service.loaded()).toBe(true);
  });

  it('should handle API error gracefully and keep default', () => {
    TestBed.resetTestingModule();
    const errMock = { getBusiness: vi.fn() };
    errMock.getBusiness.mockReturnValue(new Promise(() => {})); // never resolves
    TestBed.configureTestingModule({
      providers: [
        CurrencyContextService,
        { provide: BusinessApiService, useValue: errMock },
      ],
    });
    const s = TestBed.inject(CurrencyContextService);
    expect(s.getCode()).toBe('NGN');
  });
});
