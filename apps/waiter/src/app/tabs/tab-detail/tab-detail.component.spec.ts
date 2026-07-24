import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { TabDetailComponent } from './tab-detail.component';
import { TabsApiService, OrdersApiService, TablesApiService, MenuApiService, BusinessApiService, NotificationsApiService, ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';
import { CurrencyContextService } from '../../services/currency-context.service';

describe('TabDetailComponent', () => {
  let component: TabDetailComponent;
  let fixture: any;
  let paramMapSubject: Subject<any>;
  let mockOrderService: any;

  function createMockService(methods: string[]): any {
    const obj: any = {};
    methods.forEach(m => { obj[m] = vi.fn(); });
    return new Proxy(obj, { get(t, p) { return p in t ? t[p as string] : vi.fn().mockReturnValue(of(undefined)); } });
  }

  beforeEach(async () => {
    paramMapSubject = new Subject();

    mockOrderService = createMockService(['getByTab', 'addItems', 'deleteItem', 'approveOrder', 'deliverOrder', 'getPending']);
    const mockTabService = createMockService(['getTab', 'getAllTabs', 'closeTab', 'voidTab', 'transferTab']);
    const mockTableService = createMockService(['getTable']);
    const mockMenuService = createMockService(['getAllItems']);
    const mockBusinessApi = createMockService(['getBusiness']);
    const mockNotificationsApi = createMockService(['getNotifications']);

    mockTabService.getTab.mockReturnValue(of({ id: 'tab-1', tableId: 'table-1', status: 'open', waiterId: 'waiter-1' }));
    mockTableService.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 5, status: 'occupied' }));
    mockOrderService.getByTab.mockReturnValue(of([
      { id: 'order-1', menuItemName: 'Pizza', quantity: 2, unitPriceKobo: 5000, subtotalKobo: 10000, orderStatus: 'pending_supervisor_approval' },
    ]));
    mockMenuService.getAllItems.mockReturnValue(of([]));
    mockBusinessApi.getBusiness.mockReturnValue(of({ taxRate: 7.5 }));
    mockNotificationsApi.getNotifications.mockReturnValue(of([]));
    mockOrderService.getPending.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TabDetailComponent],
      providers: [
        CurrencyContextService,
        { provide: TabsApiService, useValue: mockTabService },
        { provide: OrdersApiService, useValue: mockOrderService },
        { provide: TablesApiService, useValue: mockTableService },
        { provide: MenuApiService, useValue: mockMenuService },
        { provide: BusinessApiService, useValue: mockBusinessApi },
        { provide: NotificationsApiService, useValue: mockNotificationsApi },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'http://test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should load tab and orders when route param changes', () => {
    const tabService = TestBed.inject(TabsApiService) as any;
    const orderService = TestBed.inject(OrdersApiService) as any;

    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();

    expect(tabService.getTab).toHaveBeenCalledWith('tab-1');
    expect(orderService.getByTab).toHaveBeenCalledWith('tab-1');
    expect(component.isLoading()).toBe(false);
  });

  it('should load menu items for the order modal', () => {
    const menuService = TestBed.inject(MenuApiService) as any;
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();
    expect(menuService.getAllItems).toHaveBeenCalled();
  });

  it('should show business settings after load', () => {
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'tab-1' }));
    fixture.detectChanges();
    expect(component.businessSettings()).toBeTruthy();
  });

  it('should format currency symbol correctly', () => {
    expect(component.currencySymbol()).toBe('₦');
  });

  it('should compute canViewBill for approved orders', () => {
    component.orderStatus = vi.fn(() => 'READY_FOR_PICKUP') as any;
    expect(component.canViewBill()).toBe(true);
  });

  it('should not show bill for pending approval', () => {
    component.orderStatus = vi.fn(() => 'PENDING_SUPERVISOR_APPROVAL') as any;
    expect(component.canViewBill()).toBe(false);
  });

  it('should compute remaining seconds from timerEndsAt', () => {
    const future = new Date(Date.now() + 120000).toISOString();
    component['timerEndsAt'] = vi.fn(() => future) as any;
    expect(component.remainingSeconds).toBeGreaterThan(0);
    expect(component.remainingSeconds).toBeLessThanOrEqual(120);
  });

  it('should return 0 remaining seconds when no timer', () => {
    component['timerEndsAt'] = vi.fn(() => null) as any;
    expect(component.remainingSeconds).toBe(0);
  });

  it('should format countdown label as MM:SS', () => {
    component['timerEndsAt'] = vi.fn(() => new Date(Date.now() + 125000).toISOString()) as any;
    const label = component.countdownLabel;
    expect(label).toMatch(/^\d{2}:\d{2}$/);
  });
});
