import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { BillComponent } from './bill.component';
import { BillsApiService, TablesApiService, TabsApiService, OrdersApiService, MenuApiService, BusinessApiService, OfflineCacheService } from '@serveiq/shared/data-access';
import { CurrencyContextService } from '../../services/currency-context.service';

describe('BillComponent', () => {
  let component: BillComponent;
  let fixture: any;
  let paramMapSubject: Subject<any>;

  function createMockService(methods: string[]): any {
    const obj: any = {};
    methods.forEach(m => { obj[m] = vi.fn(); });
    return obj;
  }

  beforeEach(async () => {
    paramMapSubject = new Subject();

    const mockBillService = createMockService(['generate', 'getReceipt']);
    const mockTabService = createMockService(['getTab']);
    const mockTableService = createMockService(['getTable']);
    const mockOrdersService = createMockService(['getByTab']);
    const mockMenuService = createMockService(['getAllItems']);
    const mockBusinessApi = createMockService(['getBusiness']);

    const mockCache = {
      getByIndex: vi.fn().mockReturnValue(of([])),
      getById: vi.fn().mockReturnValue(of(null)),
      getCached: vi.fn().mockReturnValue(of([])),
      getPendingMutations: vi.fn().mockReturnValue(of([])),
      upsert: vi.fn(),
      cacheAll: vi.fn(),
      remove: vi.fn(),
    };

    mockBillService.generate.mockReturnValue(of({
      id: 'bill-1',
      tabId: 'tab-1',
      subtotalKobo: 15000,
      serviceChargeKobo: 1500,
      discountKobo: 0,
      totalKobo: 17625,
      orderItems: [
        { id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000, subtotalKobo: 10000 },
        { id: 'order-2', menuItemName: 'Pasta', quantity: 1, unitPriceKobo: 5000, subtotalKobo: 5000 },
      ],
    }));
    mockBillService.getReceipt.mockReturnValue(of({
      bill: {
        id: 'bill-1',
        tabId: 'tab-1',
        subtotalKobo: 15000,
        serviceChargeKobo: 1500,
        discountKobo: 0,
        totalKobo: 17625,
        orderItems: [
          { id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000, subtotalKobo: 10000 },
          { id: 'order-2', menuItemName: 'Pasta', quantity: 1, unitPriceKobo: 5000, subtotalKobo: 5000 },
        ],
      },
    }));
    mockTabService.getTab.mockReturnValue(of({ id: 'tab-1', tableId: 'table-1', waiter: { fullName: 'John' } }));
    mockTableService.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 5 }));
    mockOrdersService.getByTab.mockReturnValue(of([
      { id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000, subtotalKobo: 10000 },
      { id: 'order-2', menuItemName: 'Pasta', quantity: 1, unitPriceKobo: 5000, subtotalKobo: 5000 },
    ]));
    mockMenuService.getAllItems.mockReturnValue(of([]));
    mockBusinessApi.getBusiness.mockReturnValue(of({ taxRate: 7.5 }));

    await TestBed.configureTestingModule({
      imports: [BillComponent],
      providers: [
        CurrencyContextService,
        { provide: BillsApiService, useValue: mockBillService },
        { provide: TabsApiService, useValue: mockTabService },
        { provide: TablesApiService, useValue: mockTableService },
        { provide: OrdersApiService, useValue: mockOrdersService },
        { provide: MenuApiService, useValue: mockMenuService },
        { provide: BusinessApiService, useValue: mockBusinessApi },
        { provide: OfflineCacheService, useValue: mockCache },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillComponent);
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

    expect(component.isLoading()).toBe(false);
    expect(component.bill()).toBeTruthy();
  });

  it('should compute subtotal from bill', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    expect(component.subtotalNaira()).toBe(150);
  });

  it('should compute VAT from subtotal and tax rate', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    const vat = component.getVat();
    expect(vat).toBe(11.25);
  });

  it('should compute total from bill', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    const total = component.getTotal();
    expect(total).toBe(176.25);
  });

  it('should return correct item name', () => {
    expect(component.getItemName({ menuItemName: 'Pizza' })).toBe('Pizza');
    expect(component.getItemName({ menu_item_name: 'Burger' })).toBe('Burger');
    expect(component.getItemName({})).toBe('Unknown Item');
  });

  it('should look up item name from menu items when not on order', () => {
    component.menuItems.set([{ id: 'm-1', name: 'Pasta' } as any]);
    const result = component.getItemName({ menuItemId: 'm-1' });
    expect(result).toBe('Pasta');
  });

  it('should format amounts using currency service', () => {
    const result = component.formatAmount(100);
    expect(result).toContain('100');
  });

  it('should format kobo using currency service', () => {
    const result = component.formatKobo(10000);
    expect(result).toContain('100');
  });

  it('should have currency symbol from service', () => {
    expect(component.currencySymbol()).toBe('₦');
  });

  it('should have currency code from service', () => {
    expect(component.currencyCode()).toBe('NGN');
  });

  it('should navigate to payment on proceed', () => {
    const router = TestBed.inject(Router);
    component.tabId.set('tab-1');
    component.proceedToPayment();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/payment', 'tab-1']);
  });
});
