import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TablesApiService, TabsApiService, OrdersApiService, BusinessApiService, AuthService, UserApiService, ShiftsApiService, NotificationsApiService } from '@serveiq/shared/data-access';
import { TablesComponent } from './tables.component';
import { of } from 'rxjs';

describe('TablesComponent', () => {
  let component: TablesComponent;
  let fixture: any;

  function createMockService(methods: string[]): any {
    const obj: any = {};
    methods.forEach(m => { obj[m] = vi.fn(); });
    return new Proxy(obj, { get(t, p) { return p in t ? t[p as string] : vi.fn().mockReturnValue(of(undefined)); } });
  }

  beforeEach(async () => {
    const mockTablesApi = createMockService(['getAllTables', 'updateTableStatus', 'releaseTable']);
    const mockTabsApi = createMockService(['getAllTabs', 'closeTab', 'voidTab', 'getTab']);
    const mockOrdersApi = createMockService(['getByTab']);
    const mockAuthService = createMockService(['logout', 'getToken']);
    mockAuthService.getToken.mockReturnValue('');
    const mockBusinessApi = createMockService(['getBusiness']);
    mockBusinessApi.getBusiness.mockReturnValue(of({ currency: 'NGN' }));
    const mockUserApi = createMockService(['getMe', 'getStaff']);
    mockUserApi.getMe.mockReturnValue(of({ id: 'u-1', fullName: 'Test Waiter', role: 'waiter' }));
    const mockShiftsApi = createMockService(['getCurrent', 'list', 'closeShift']);
    mockShiftsApi.getCurrent.mockReturnValue(of(null));
    const mockNotificationsApi = createMockService(['list', 'markRead']);
    mockNotificationsApi.list.mockReturnValue(of([]));

    mockTablesApi.getAllTables.mockReturnValue(of([
      { id: 't-1', tableNumber: 1, status: 'available', capacity: 4 },
      { id: 't-2', tableNumber: 2, status: 'occupied', capacity: 2 },
    ]));
    mockTabsApi.getAllTabs.mockReturnValue(of([
      { id: 'tab-1', tableId: 't-2', status: 'open' },
    ]));
    mockOrdersApi.getByTab.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TablesComponent],
      providers: [
        { provide: TablesApiService, useValue: mockTablesApi },
        { provide: TabsApiService, useValue: mockTabsApi },
        { provide: OrdersApiService, useValue: mockOrdersApi },
        { provide: AuthService, useValue: mockAuthService },
        { provide: BusinessApiService, useValue: mockBusinessApi },
        { provide: UserApiService, useValue: mockUserApi },
        { provide: ShiftsApiService, useValue: mockShiftsApi },
        { provide: NotificationsApiService, useValue: mockNotificationsApi },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TablesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load tables on init', () => {
    fixture.detectChanges();
    expect(component.tables().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBe(false);
  });

  it('should load open tabs on init', () => {
    fixture.detectChanges();
    expect(component.openTabs().length).toBeGreaterThan(0);
  });

  it('should identify occupied table', () => {
    fixture.detectChanges();
    const table = component.tables().find(t => t.id === 't-2');
    expect(table?.status).toBe('occupied');
  });

  it('should identify available table', () => {
    fixture.detectChanges();
    const table = component.tables().find(t => t.id === 't-1');
    expect(table?.status).toBe('available');
  });

  it('should detect if table has open tab', () => {
    fixture.detectChanges();
    const tab = component.getTabForTable('t-2');
    expect(tab).toBeTruthy();
    expect(tab?.id).toBe('tab-1');
  });

  it('should return null for table with no tab', () => {
    const tab = component.getTabForTable('t-1');
    expect(tab).toBeUndefined();
  });

  it('should return waiter name for table', () => {
    const name = component.getWaiterName('t-2');
    expect(name).toBeNull();
  });

  it('should reload tables', () => {
    const tablesApi = TestBed.inject(TablesApiService) as any;
    tablesApi.getAllTables.mockClear();
    component.loadTables();
    expect(tablesApi.getAllTables).toHaveBeenCalled();
  });
});
