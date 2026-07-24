import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SupervisorOrdersComponent } from './supervisor-orders.component';
import { OrdersApiService, DepartmentsApiService, TablesApiService, ShiftsApiService, UserApiService, AuditApiService, AuthService, BusinessApiService } from '@serveiq/shared/data-access';
import { CurrencyContextService } from '../services/currency-context.service';

describe('SupervisorOrdersComponent', () => {
  let component: SupervisorOrdersComponent;
  let fixture: any;

  function createMockService(methods: string[]): any {
    const obj: any = {};
    methods.forEach(m => { obj[m] = vi.fn(); });
    return new Proxy(obj, { get(t, p) { return p in t ? t[p as string] : vi.fn().mockReturnValue(of(undefined)); } });
  }

  beforeEach(async () => {
    const mockOrdersApi = createMockService(['getPending', 'getPreparing', 'getReadyForPickup', 'approveOrder', 'declineOrder', 'getByTab', 'confirmPickup', 'deliverOrder']);
    mockOrdersApi.getPending.mockReturnValue(of([
      {
        tabId: 'tab-1',
        tableNumber: 5,
        waiterName: 'John',
        items: [{ id: 'order-1', menuItemName: 'Pizza', quantity: 1, unitPriceKobo: 5000, subtotalKobo: 5000, orderStatus: 'pending_supervisor_approval' }],
      },
    ]));
    mockOrdersApi.getPreparing.mockReturnValue(of([]));
    mockOrdersApi.getReadyForPickup.mockReturnValue(of([]));
    const mockDepartmentsApi = createMockService(['getAll']);
    mockDepartmentsApi.getAll.mockReturnValue(of([{ id: 'dept-1', name: 'Kitchen' }]));
    const mockTablesApi = createMockService(['getAllTables']);
    mockTablesApi.getAllTables.mockReturnValue(of([]));
    const mockShiftsApi = createMockService(['getCurrent', 'closeShift']);
    mockShiftsApi.getCurrent.mockReturnValue(of(null));
    const mockUserApi = createMockService(['getMe', 'listWaiters']);
    mockUserApi.getMe.mockReturnValue(of({ id: 'u-1', fullName: 'Test', role: 'waiter' }));
    mockUserApi.listWaiters.mockReturnValue(of([]));
    const mockAuditApi = createMockService(['list', 'recent']);
    mockAuditApi.list.mockReturnValue(of([]));
    mockAuditApi.recent.mockReturnValue(of([]));
    const mockAuthService = createMockService(['logout']);

    const mockBusinessApi = createMockService(['getBusiness']);
    mockBusinessApi.getBusiness.mockReturnValue(of({ currency: 'NGN' }));

    await TestBed.configureTestingModule({
      imports: [SupervisorOrdersComponent],
      providers: [
        CurrencyContextService,
        { provide: OrdersApiService, useValue: mockOrdersApi },
        { provide: DepartmentsApiService, useValue: mockDepartmentsApi },
        { provide: TablesApiService, useValue: mockTablesApi },
        { provide: ShiftsApiService, useValue: mockShiftsApi },
        { provide: UserApiService, useValue: mockUserApi },
        { provide: AuditApiService, useValue: mockAuditApi },
        { provide: AuthService, useValue: mockAuthService },
        { provide: BusinessApiService, useValue: mockBusinessApi },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupervisorOrdersComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start with pending tab selected', () => {
    expect(component.activeTab()).toBe('pending');
  });

  it('should load pending orders on init', () => {
    fixture.detectChanges();
    expect(component.pendingOrders().length).toBeGreaterThan(0);
    expect(component.isLoadingPending()).toBe(false);
  });

  it('should switch tabs', () => {
    component.switchTab('preparing');
    expect(component.activeTab()).toBe('preparing');
    component.switchTab('ready');
    expect(component.activeTab()).toBe('ready');
  });

  it('should load departments on init', () => {
    fixture.detectChanges();
    expect(component.departments().length).toBeGreaterThan(0);
  });

  it('should compute waiters on duty', () => {
    component.waiters.set([
      { id: 'w-1', fullName: 'John', isActive: true } as any,
      { id: 'w-2', fullName: 'Jane', isActive: false } as any,
    ]);
    expect(component.waitersOnDuty().length).toBe(1);
    expect(component.waitersOnDuty()[0].fullName).toBe('John');
  });

  it('should toggle dark mode', () => {
    const initial = component.isDarkMode();
    component.toggleTheme();
    expect(component.isDarkMode()).toBe(!initial);
  });

  it('should refresh all data', () => {
    const ordersApi = TestBed.inject(OrdersApiService) as any;
    ordersApi.getPending.mockClear();
    component.refreshAll();
    expect(ordersApi.getPending).toHaveBeenCalled();
  });

  it('should go back', () => {
    const router = TestBed.inject(Router);
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/tables']);
  });
});
