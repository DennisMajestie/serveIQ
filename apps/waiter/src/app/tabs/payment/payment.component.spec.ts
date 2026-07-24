import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { PaymentComponent } from './payment.component';
import { BillsApiService, TabsApiService, TablesApiService, PosApiService, BusinessApiService } from '@serveiq/shared/data-access';
import { CurrencyContextService } from '../../services/currency-context.service';

describe('PaymentComponent', () => {
  let component: PaymentComponent;
  let fixture: any;
  let paramMapSubject: Subject<any>;

  function createMockService(methods: string[]): any {
    const obj: any = {};
    methods.forEach(m => { obj[m] = vi.fn(); });
    return obj;
  }

  beforeEach(async () => {
    paramMapSubject = new Subject();

    const mockBillsApi = createMockService(['generate', 'getReceipt']);
    const mockTabService = createMockService(['getTab', 'closeTab']);
    const mockTableService = createMockService(['getTable']);
    const mockPosApi = createMockService(['processPayment', 'getTerminals', 'getActive']);
    const mockBusinessApi = createMockService(['getBusiness']);
    mockBusinessApi.getBusiness.mockReturnValue(of({ currency: 'NGN' }));
    const mockHttp = { post: vi.fn() };

    mockBillsApi.generate.mockReturnValue(of({
      id: 'bill-1',
      tabId: 'tab-1',
      subtotalKobo: 15000,
      totalKobo: 17625,
      orderItems: [{ id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000 }],
    }));
    mockTabService.getTab.mockReturnValue(of({ id: 'tab-1', tableId: 'table-1', partySize: 4 }));
    mockTableService.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 5 }));
    mockPosApi.getTerminals.mockReturnValue(of([]));
    mockPosApi.processPayment.mockReturnValue(of({ success: true }));
    mockPosApi.getActive.mockReturnValue(of([]));
    mockBillsApi.getReceipt.mockReturnValue(of({
      bill: {
        id: 'bill-1',
        tabId: 'tab-1',
        subtotalKobo: 15000,
        totalKobo: 17625,
        orderItems: [{ id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000 }],
      },
    }));

    await TestBed.configureTestingModule({
      imports: [PaymentComponent],
      providers: [
        CurrencyContextService,
        { provide: BillsApiService, useValue: mockBillsApi },
        { provide: TabsApiService, useValue: mockTabService },
        { provide: TablesApiService, useValue: mockTableService },
        { provide: PosApiService, useValue: mockPosApi },
        { provide: BusinessApiService, useValue: mockBusinessApi },
        { provide: HttpClient, useValue: mockHttp },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should load bill when route param changes', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    expect(component.bill()).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });

  it('should default payment method to cash', () => {
    expect(component.selectedMethod).toBe('cash');
  });

  it('should switch payment method', () => {
    component.selectMethod('card');
    expect(component.selectedMethod).toBe('card');
  });

  it('should toggle split payment', () => {
    component.toggleSplit();
    expect(component.isSplit()).toBe(true);
    component.toggleSplit();
    expect(component.isSplit()).toBe(false);
  });

  it('should compute split amounts when split is toggled', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    component.toggleSplit();
    expect(component.isSplit()).toBe(true);
  });

  it('should not exceed max guests for split count', () => {
    component.maxGuests.set(3);
    component.splitCount.set(5);
    expect(component.splitCount()).toBe(5);
  });

  it('should have items from bill', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    expect(component.items().length).toBeGreaterThan(0);
  });

  it('should navigate to receipt on success', () => {
    const router = TestBed.inject(Router);
    component.tabId.set('tab-1');
    component.isSuccess.set(true);
    expect(component.isSuccess()).toBe(true);
  });

  it('should compute payment summary', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();
    expect(component.currencySymbol()).toBe('₦');
  });
});
