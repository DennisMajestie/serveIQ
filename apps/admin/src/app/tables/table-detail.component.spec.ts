import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TableDetailComponent } from './table-detail.component';
import { TabsApiService, OrdersApiService, BillsApiService, MenuApiService, TablesApiService } from '@serveiq/shared/data-access';
import { ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function createMockService(methods: string[]): any {
  const obj: any = {};
  methods.forEach(m => { obj[m] = vi.fn(); });
  return obj;
}

describe('TableDetailComponent', () => {
  let component: TableDetailComponent;
  let fixture: any;
  let paramMapSubject: Subject<any>;

  beforeEach(async () => {
    paramMapSubject = new Subject();

    const mockTablesApi = createMockService(['getTable', 'getAllTables', 'updateTable']);
    const mockTabsApi = createMockService(['getAllTabs', 'getTab', 'closeTab', 'voidTab', 'createTab', 'transferTab']);
    const mockOrdersApi = createMockService(['getByTab', 'addItems', 'deleteItem']);
    const mockMenuApi = createMockService(['getAllItems']);
    const mockBillsApi = createMockService(['generate', 'getReceipt']);

    mockTablesApi.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 'T5', capacity: 4, status: 'available' as const }));
    mockTabsApi.getAllTabs.mockReturnValue(of([]));
    mockOrdersApi.getByTab.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TableDetailComponent],
      providers: [
        { provide: TablesApiService, useValue: mockTablesApi },
        { provide: TabsApiService, useValue: mockTabsApi },
        { provide: OrdersApiService, useValue: mockOrdersApi },
        { provide: MenuApiService, useValue: mockMenuApi },
        { provide: BillsApiService, useValue: mockBillsApi },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'http://test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TableDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should load table data when route param changes', () => {
    const tablesApi = TestBed.inject(TablesApiService) as any;
    const tabsApi = TestBed.inject(TabsApiService) as any;

    tablesApi.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 'T5', capacity: 4, status: 'available' as const }));
    tabsApi.getAllTabs.mockReturnValue(of([]));

    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'table-1' }));
    fixture.detectChanges();

    expect(tablesApi.getTable).toHaveBeenCalledWith('table-1');
    expect(tabsApi.getAllTabs).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.table()?.tableNumber).toBe('T5');
  });

  it('should find open tab for the table and load orders', () => {
    const tablesApi = TestBed.inject(TablesApiService) as any;
    const tabsApi = TestBed.inject(TabsApiService) as any;
    const ordersApi = TestBed.inject(OrdersApiService) as any;

    tablesApi.getTable.mockReturnValue(of({ id: 'table-1', tableNumber: 'T5', capacity: 4, status: 'occupied' as const }));
    tabsApi.getAllTabs.mockReturnValue(of([{ id: 'tab-1', tableId: 'table-1', status: 'open' }]));
    ordersApi.getByTab.mockReturnValue(of([{ id: 'order-1', menuItemName: 'Pizza', quantity: 2, priceKobo: 5000 }]));

    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'table-1' }));
    fixture.detectChanges();

    expect(ordersApi.getByTab).toHaveBeenCalledWith('tab-1');
    expect(component.tab()?.id).toBe('tab-1');
    expect(component.orders()).toHaveLength(1);
    expect(component.orders()[0].menuItemName).toBe('Pizza');
  });

  it('should handle load error gracefully', () => {
    const tablesApi = TestBed.inject(TablesApiService) as any;
    tablesApi.getTable.mockReturnValue(throwError(() => new Error('API error')));

    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap({ id: 'table-1' }));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
  });

  it('should compute correct totals from orders', () => {
    component.orders.set([
      { id: 'o1', tabId: 'tab-1', menuItemId: 'm1', menuItemName: 'Pizza', priceKobo: 5000, quantity: 2 } as any,
      { id: 'o2', tabId: 'tab-1', menuItemId: 'm2', menuItemName: 'Pasta', priceKobo: 3000, quantity: 1 } as any,
    ]);

    expect(component.getSubtotal()).toBe(13000);
    expect(component.getVat()).toBe(975);
    expect(component.getTotal()).toBe(13975);
  });

  it('should format kobo correctly', () => {
    expect(component.formatKobo(10000)).toBe('100.00');
    expect(component.formatKobo(10500)).toBe('105.00');
    expect(component.formatKobo(0)).toBe('0.00');
    expect(component.formatKobo(1234)).toBe('12.34');
  });
});
