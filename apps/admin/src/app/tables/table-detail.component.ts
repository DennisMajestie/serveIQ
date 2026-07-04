import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, BillsApiService, MenuApiService, TablesApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table, MenuItem } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-table-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-content">
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading table details...</p>
      </div>

      <ng-container *ngIf="!isLoading()">
        <div class="page-header">
          <div class="page-title-section">
            <button class="icon-btn" (click)="goBack()">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 class="page-title">Table {{ table()?.tableNumber || tableId() }}</h2>
            <span class="status-badge" [class]="'status-' + (tab()?.status || table()?.status || 'available')">
              <span class="status-dot"></span>
              {{ (tab()?.status || table()?.status || 'available') | titlecase }}
            </span>
          </div>
          <div class="page-actions">
            <button class="page-action-btn" (click)="viewHistory()">
              <span class="material-symbols-outlined">history</span>
              View History
            </button>
            <button class="page-action-btn" (click)="editTable()">
              <span class="material-symbols-outlined">edit</span>
              Edit Table
            </button>
          </div>
        </div>

        <div *ngIf="!tab()" class="no-tab-message">
          <span class="material-symbols-outlined" style="font-size: 48px;">table_restaurant</span>
          <h3>No Open Tab</h3>
          <p>This table does not have an active tab.</p>
          <button class="add-item-btn" (click)="openAddItemsModal()">
            <span class="material-symbols-outlined">add</span>
            Open New Tab
          </button>
        </div>

        <div *ngIf="tab()" class="grid-layout">
          <div class="column left">
            <div class="order-card">
              <div class="card-header">
                <h3 class="card-title">Current Order</h3>
                <button class="add-item-btn" (click)="openAddItemsModal()">
                  <span class="material-symbols-outlined">add</span>
                  Add Item
                </button>
              </div>
              <div class="table-wrapper">
                <table class="order-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="table-row" *ngFor="let item of orders(); trackBy: trackById">
                      <td>
                        <div class="item-cell">
                          <div class="item-icon">
                            <span class="material-symbols-outlined">restaurant</span>
                          </div>
                          <div class="item-details">
                            <p class="item-name">{{ item.menuItemName || item.menu_item_name }}</p>
                            <p class="item-notes" *ngIf="item.notes">{{ item.notes }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="text-center">{{ item.quantity || item.qty }}</td>
                      <td class="text-right">₦{{ formatKobo(item.priceKobo || item.price_kobo || item.unit_price_kobo || 0) }}</td>
                      <td class="text-right total">₦{{ formatKobo((item.priceKobo || item.price_kobo || item.unit_price_kobo || 0) * (item.quantity || item.qty || 1)) }}</td>
                      <td class="text-center">
                        <button class="delete-btn" (click)="removeOrderItem(item)" title="Remove item">
                          <span class="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="column right">
            <div class="summary-card">
              <div class="card-header">
                <h3 class="card-title">Order Summary</h3>
              </div>
              <div class="summary-content">
                <div class="summary-row">
                  <span class="label">Subtotal</span>
                  <span class="value">₦{{ formatKobo(getSubtotal()) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">VAT (7.5%)</span>
                  <span class="value">₦{{ formatKobo(getVat()) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">Service Charge</span>
                  <span class="value">₦{{ formatKobo(getServiceCharge()) }}</span>
                </div>
                <div class="summary-row total">
                  <span class="label">Total Amount</span>
                  <span class="value">₦{{ formatKobo(getTotal()) }}</span>
                </div>
              </div>
              <div class="summary-footer">
                <button class="close-tab-btn" (click)="closeTab()">Close Tab</button>
                <button class="print-bill-btn" (click)="printBill()">Print Bill</button>
              </div>
            </div>
            <button class="void-btn" (click)="voidTab()">
              <span class="material-symbols-outlined">cancel</span>
              Void Order
            </button>
          </div>
        </div>

        <footer class="page-footer">
          <div class="footer-left">
            <span class="material-symbols-outlined">schedule</span>
            <span *ngIf="tab()?.openedAt">Opened {{ getTimeAgo(tab()!.openedAt) }}</span>
            <span *ngIf="!tab()?.openedAt">Table {{ table()?.tableNumber || tableId() }}</span>
          </div>
          <div class="footer-right">
            Table Detail • ServeIQ
          </div>
        </footer>
      </ng-container>
    </div>

    <!-- Add Items Modal -->
    <div class="modal-overlay" *ngIf="showAddItemsModal()" (click)="closeAddItemsModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Add Items</h3>
          <button class="modal-close" (click)="closeAddItemsModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="category-filter" *ngIf="categories().length > 0">
            <button *ngFor="let cat of categories()" class="cat-btn" [class.active]="selectedCategory() === cat" (click)="selectedCategory.set(cat)">
              {{ cat }}
            </button>
          </div>
          <div class="search-box">
            <input type="text" [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" placeholder="Search items..." class="search-input">
          </div>
          <div class="menu-grid" *ngIf="!isLoadingMenu(); else menuSkeleton">
            <div class="menu-item-card" *ngFor="let item of filteredMenuItems()">
              <div class="item-card-details">
                <h4>{{ item.name }}</h4>
                <span class="item-category">{{ item.category }}</span>
                <span class="item-price">₦{{ formatKobo(item.priceKobo || 0) }}</span>
                <button class="btn-add-item" (click)="addItemToSelection(item)">
                  + Add
                </button>
              </div>
            </div>
            <div class="menu-empty" *ngIf="filteredMenuItems().length === 0">
              <p>No items found</p>
            </div>
          </div>
          <ng-template #menuSkeleton>
            <div class="menu-grid">
              <div class="menu-skeleton" *ngFor="let i of [1,2,3,4,5,6]"></div>
            </div>
          </ng-template>
        </div>
        <div class="modal-footer" *ngIf="selectedMenuItems().length > 0">
          <div class="selection-summary">
            <h4>Selected Items ({{ selectedMenuItems().length }})</h4>
            <div class="selected-items-list">
              <div class="selected-item" *ngFor="let s of selectedMenuItems(); let i = index">
                <span>{{ s.menuItem.name }} × {{ s.quantity }}</span>
                <button class="remove-selected" (click)="removeItemFromSelection(i)">&times;</button>
              </div>
            </div>
          </div>
          <button class="btn-primary" (click)="confirmAddItems()" [disabled]="isAddingItems()">
            {{ isAddingItems() ? 'Adding...' : 'Add to Tab' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      background: var(--background);
      color: var(--on-surface);
      font-family: 'Inter', sans-serif;
    }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }
    .page-content { padding: 32px; }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      gap: 16px;
      color: var(--secondary);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--surface-container-high);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .page-title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .page-title {
      font-size: 32px;
      line-height: 40px;
      font-weight: 700;
      margin: 0;
    }
    .no-tab-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      gap: 12px;
      color: var(--secondary);
    }
    .no-tab-message h3 { margin: 0; color: var(--on-surface); }
    .no-tab-message p { margin: 0; }
    .status-badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      line-height: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .status-badge.status-open { background: rgba(34,197,94,0.1); color: rgb(21,128,61); }
    .status-badge.status-paid { background: rgba(59,130,246,0.1); color: rgb(29,78,216); }
    .status-badge.status-voided { background: rgba(186,26,26,0.1); color: rgb(185,28,28); }
    .status-badge.status-available { background: rgba(34,197,94,0.1); color: rgb(21,128,61); }
    .status-badge.status-occupied { background: rgba(249,115,22,0.1); color: rgb(194,65,0); }
    .status-badge.status-reserved { background: rgba(139,92,246,0.1); color: rgb(109,40,217); }
    .status-dot {
      width: 8px; height: 8px; border-radius: 9999px;
    }
    .status-open .status-dot, .status-available .status-dot { background: rgb(34,197,94); }
    .status-paid .status-dot { background: rgb(59,130,246); }
    .status-voided .status-dot { background: rgb(185,28,28); }
    .status-occupied .status-dot { background: rgb(249,115,22); }
    .status-reserved .status-dot { background: rgb(139,92,246); }
    .page-actions { display: flex; gap: 12px; }
    .icon-btn {
      background: transparent; border: none; color: var(--secondary);
      cursor: pointer; padding: 8px; border-radius: 9999px;
      display: flex; align-items: center; gap: 4px; transition: all 0.2s ease;
    }
    .icon-btn:hover { background: var(--surface-container-high); }
    .page-action-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; background: transparent; border: none;
      color: var(--secondary); font-size: 14px; line-height: 20px;
      font-weight: 600; font-family: 'Inter', sans-serif;
      cursor: pointer; border-radius: 8px; transition: all 0.2s ease;
    }
    .page-action-btn:hover { background: var(--surface-container-high); }
    .grid-layout {
      display: grid;
      grid-template-columns: 8fr 4fr;
      gap: 32px;
      align-items: flex-start;
    }
    .column { display: flex; flex-direction: column; gap: 24px; }
    .order-card, .summary-card {
      background: var(--surface-container-lowest);
      border-radius: 16px;
      border: 1px solid var(--outline-variant);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--outline-variant); background: white;
    }
    .card-title { font-size: 18px; line-height: 28px; font-weight: 700; margin: 0; }
    .add-item-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; background: rgba(157,67,0,0.05);
      color: var(--primary); border: 1px solid rgba(157,67,0,0.2);
      border-radius: 8px; font-size: 14px; line-height: 20px;
      font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease;
    }
    .add-item-btn:hover { background: rgba(157,67,0,0.1); }
    .table-wrapper { overflow-x: auto; }
    .order-table { width: 100%; border-collapse: collapse; }
    .order-table thead tr { background: var(--surface-container-low); }
    .order-table th {
      font-size: 14px; line-height: 20px; font-weight: 600;
      color: var(--secondary); text-transform: uppercase;
      letter-spacing: 0.08em; padding: 16px 24px; text-align: left;
    }
    .order-table th:nth-child(2), .order-table th:nth-child(5) { text-align: center; }
    .order-table th:nth-child(3), .order-table th:nth-child(4) { text-align: right; }
    .table-row { transition: all 0.2s ease; }
    .table-row:nth-child(even) { background: var(--surface); }
    .table-row:hover { background: rgba(249,115,22,0.05); transform: translateX(4px); }
    .item-cell { display: flex; align-items: center; gap: 12px; }
    .item-icon {
      width: 48px; height: 48px; background: var(--surface-container);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
    }
    .item-icon .material-symbols-outlined { color: var(--primary); font-size: 24px; }
    .item-details { display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-size: 16px; line-height: 24px; font-weight: 700; margin: 0; }
    .item-notes { font-size: 12px; line-height: 16px; color: var(--secondary); margin: 0; }
    .order-table td { padding: 20px 24px; font-size: 14px; line-height: 20px; }
    .text-center { text-align: center; font-family: 'JetBrains Mono', monospace; }
    .text-right { text-align: right; font-family: 'JetBrains Mono', monospace; }
    .total { font-weight: 700; }
    .delete-btn {
      background: transparent; border: none; color: var(--secondary);
      cursor: pointer; opacity: 0; transition: all 0.2s ease; padding: 4px;
    }
    .table-row:hover .delete-btn { opacity: 1; }
    .delete-btn:hover { color: var(--error); }
    .summary-content { padding: 24px; }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    }
    .summary-row:last-of-type { margin-bottom: 0; }
    .summary-row .label { font-size: 16px; line-height: 24px; font-weight: 400; color: var(--secondary); }
    .summary-row .value { font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 20px; font-weight: 600; }
    .summary-row.total {
      padding-top: 16px; border-top: 1px solid var(--outline-variant);
      margin-top: 16px; align-items: flex-end;
    }
    .summary-row.total .label { font-size: 24px; line-height: 32px; font-weight: 700; color: var(--primary); }
    .summary-row.total .value { font-size: 24px; line-height: 32px; font-weight: 700; color: var(--on-surface); }
    .summary-footer {
      padding: 24px; background: var(--surface-container-low);
      display: flex; flex-direction: column; gap: 12px;
    }
    .close-tab-btn {
      width: 100%; height: 56px; background: var(--primary-container);
      color: var(--on-primary-container); border: none; border-radius: 12px;
      font-size: 16px; line-height: 24px; font-weight: 600;
      font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(157,67,0,0.15);
    }
    .close-tab-btn:active { transform: scale(0.98); }
    .print-bill-btn {
      width: 100%; height: 56px; background: white; color: var(--primary);
      border: 2px solid var(--primary); border-radius: 12px;
      font-size: 16px; line-height: 24px; font-weight: 600;
      font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease;
    }
    .print-bill-btn:hover { background: rgba(157,67,0,0.05); }
    .print-bill-btn:active { transform: scale(0.98); }
    .void-btn {
      width: 100%; display: flex; align-items: center; justify-content: center;
      gap: 8px; background: transparent; color: var(--error); border: none;
      padding: 12px; font-size: 14px; line-height: 20px; font-weight: 600;
      font-family: 'Inter', sans-serif; cursor: pointer; border-radius: 8px; transition: all 0.2s ease;
    }
    .void-btn:hover { background: rgba(186,26,26,0.1); }
    .page-footer {
      padding: 24px; margin-top: 32px; border-top: 1px solid var(--outline-variant);
      display: flex; justify-content: space-between; align-items: center; color: var(--secondary);
    }
    .footer-left { display: flex; align-items: center; gap: 8px; font-size: 14px; line-height: 20px; }
    .footer-right { font-size: 12px; line-height: 16px; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-content.large {
      background: var(--surface-container-lowest); border-radius: 16px;
      width: 700px; max-width: 90vw; max-height: 80vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--outline-variant);
    }
    .modal-title { font-size: 20px; font-weight: 700; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--secondary); padding: 4px; border-radius: 4px; }
    .modal-close:hover { background: var(--surface-container-high); }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer {
      padding: 20px 24px; border-top: 1px solid var(--outline-variant);
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .category-filter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .cat-btn {
      padding: 6px 14px; border-radius: 9999px; border: 1px solid var(--outline-variant);
      background: transparent; cursor: pointer; font-size: 13px; font-weight: 600;
      font-family: 'Inter', sans-serif; transition: all 0.2s ease;
    }
    .cat-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .search-box { margin-bottom: 16px; }
    .search-input {
      width: 100%; padding: 12px 16px; border: 1px solid var(--outline-variant);
      border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif;
      box-sizing: border-box; background: var(--surface);
    }
    .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .menu-item-card {
      border: 1px solid var(--outline-variant); border-radius: 12px;
      padding: 16px; background: var(--surface);
    }
    .menu-item-card h4 { margin: 0 0 4px; font-size: 14px; }
    .item-category { font-size: 12px; color: var(--secondary); }
    .item-price { display: block; font-weight: 700; margin: 8px 0; font-family: 'JetBrains Mono', monospace; }
    .btn-add-item {
      padding: 6px 12px; background: var(--primary); color: white;
      border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
      font-family: 'Inter', sans-serif;
    }
    .btn-add-item:hover { opacity: 0.9; }
    .menu-empty { grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--secondary); }
    .menu-skeleton { height: 100px; background: var(--surface-container-high); border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .selection-summary { flex: 1; }
    .selection-summary h4 { margin: 0 0 8px; font-size: 14px; }
    .selected-items-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .selected-item {
      display: flex; align-items: center; gap: 6px;
      background: var(--surface-container-high); padding: 4px 10px;
      border-radius: 9999px; font-size: 13px;
    }
    .remove-selected { background: none; border: none; cursor: pointer; color: var(--error); font-size: 16px; line-height: 1; padding: 0; }
    .btn-primary {
      padding: 10px 24px; background: var(--primary); color: white;
      border: none; border-radius: 8px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class TableDetailComponent implements OnInit {
  private tabsApi = inject(TabsApiService);
  private ordersApi = inject(OrdersApiService);
  private billsApi = inject(BillsApiService);
  private menuApi = inject(MenuApiService);
  private tablesApi = inject(TablesApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tableId = signal('');
  table = signal<Table | null>(null);
  tab = signal<Tab | null>(null);
  orders = signal<OrderItem[]>([]);
  isLoading = signal(true);

  subtotal = computed(() => this.getSubtotal());
  vat = computed(() => this.getVat());
  serviceCharge = signal(0);
  totalAmount = computed(() => this.getTotal());

  showAddItemsModal = signal(false);
  menuItems = signal<MenuItem[]>([]);
  categories = signal<string[]>(['All']);
  isLoadingMenu = signal(false);
  selectedCategory = signal('All');
  searchQuery = signal('');
  selectedMenuItems = signal<{ menuItem: MenuItem; quantity: number; notes?: string }[]>([]);
  isAddingItems = signal(false);

  filteredMenuItems = computed(() => {
    let items = this.menuItems();
    const cat = this.selectedCategory();
    if (cat !== 'All') items = items.filter(i => i.category === cat);
    const q = this.searchQuery().toLowerCase();
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
    return items;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tableId.set(id);
        this.loadData();
      }
    });
  }

  loadData() {
    this.isLoading.set(true);
    const id = this.tableId();

    this.tablesApi.getTable(id).subscribe({
      next: (table) => {
        this.table.set(table);
        this.loadTabForTable(id);
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Failed to load table', confirmButtonColor: '#F97316' });
        this.isLoading.set(false);
      }
    });
  }

  loadTabForTable(tableId: string) {
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        const openTab = tabs.find(t => t.tableId === tableId && t.status === 'open');
        if (openTab) {
          this.tab.set(openTab);
          this.loadOrders(openTab.id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadOrders(tabId: string) {
    this.ordersApi.getByTab(tabId).subscribe({
      next: (items) => {
        this.orders.set(items || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  viewHistory() {
    this.router.navigate(['/tabs']);
  }

  editTable() {
    Swal.fire({
      title: 'Edit Table ' + (this.table()?.tableNumber || this.tableId()),
      html: `
        <input id="swal-number" class="swal2-input" placeholder="Table number" value="${this.table()?.tableNumber || ''}">
        <input id="swal-capacity" class="swal2-input" placeholder="Capacity" type="number" value="${this.table()?.capacity || ''}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: '#F97316',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-number') as HTMLInputElement).value;
        const capacity = parseInt((document.getElementById('swal-capacity') as HTMLInputElement).value, 10);
        if (!tableNumber) { Swal.showValidationMessage('Table number is required'); return false; }
        if (!capacity || capacity < 1) { Swal.showValidationMessage('Capacity must be at least 1'); return false; }
        return { tableNumber, capacity };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.tablesApi.updateTable(this.tableId(), result.value).subscribe({
          next: (updated) => {
            this.table.set(updated);
            Swal.fire({ icon: 'success', title: 'Table Updated', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Update Failed', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  openAddItemsModal() {
    this.showAddItemsModal.set(true);
    this.selectedMenuItems.set([]);
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.loadMenuItems();
  }

  closeAddItemsModal() {
    this.showAddItemsModal.set(false);
    this.selectedMenuItems.set([]);
  }

  loadMenuItems() {
    this.isLoadingMenu.set(true);
    this.menuApi.getAllItems().subscribe({
      next: (items) => {
        this.menuItems.set(items);
        this.categories.set(['All', ...new Set(items.map(i => i.category))]);
        this.isLoadingMenu.set(false);
      },
      error: () => this.isLoadingMenu.set(false)
    });
  }

  addItemToSelection(item: MenuItem) {
    const existing = this.selectedMenuItems().find(s => s.menuItem.id === item.id);
    if (existing) {
      this.selectedMenuItems.update(items => items.map(s =>
        s.menuItem.id === item.id ? { ...s, quantity: s.quantity + 1 } : s
      ));
    } else {
      this.selectedMenuItems.update(items => [...items, { menuItem: item, quantity: 1 }]);
    }
  }

  removeItemFromSelection(index: number) {
    this.selectedMenuItems.update(items => items.filter((_, i) => i !== index));
  }

  confirmAddItems() {
    if (this.selectedMenuItems().length === 0) return;

    const tab = this.tab();
    if (!tab) {
      Swal.fire({ icon: 'info', title: 'Open a tab first', confirmButtonColor: '#F97316' });
      return;
    }

    this.isAddingItems.set(true);
    const items = this.selectedMenuItems().map(s => ({
      menu_item_id: s.menuItem.id,
      quantity: s.quantity,
      notes: s.notes || ''
    }));

    this.ordersApi.addItems(tab.id, items).subscribe({
      next: () => {
        this.isAddingItems.set(false);
        this.closeAddItemsModal();
        Swal.fire({ icon: 'success', title: 'Items Added', timer: 1500, showConfirmButton: false });
        this.loadOrders(tab.id);
      },
      error: () => {
        this.isAddingItems.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to add items', confirmButtonColor: '#F97316' });
      }
    });
  }

  removeOrderItem(item: OrderItem) {
    Swal.fire({
      title: 'Remove item?',
      text: `Remove "${item.menuItemName || item.menu_item_name}" from this tab?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then(result => {
      if (result.isConfirmed) {
        this.ordersApi.deleteItem(item.id).subscribe({
          next: () => this.orders.update(os => os.filter(o => o.id !== item.id)),
          error: () => Swal.fire({ icon: 'error', title: 'Remove Failed', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  closeTab() {
    const tab = this.tab();
    if (!tab) return;

    this.billsApi.generate(tab.id).subscribe({
      next: (bill) => {
        this.tabsApi.closeTab(tab.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Tab Closed',
              html: `
                <div style="text-align:left;font-family:monospace;font-size:0.9rem">
                  <p><strong>Subtotal:</strong> ₦${this.formatKobo(bill.subtotalKobo)}</p>
                  <p><strong>Service Charge:</strong> ${bill.serviceChargePercent}%</p>
                  <p><strong>Total:</strong> ₦${this.formatKobo(bill.totalKobo)}</p>
                </div>
              `,
              confirmButtonText: 'View Bills',
              confirmButtonColor: '#F97316',
              showCancelButton: true,
              cancelButtonText: 'Close'
            }).then(result => {
              if (result.isConfirmed) this.router.navigate(['/bills']);
              else this.loadData();
            });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to Close Tab', confirmButtonColor: '#F97316' })
        });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to Generate Bill', confirmButtonColor: '#F97316' })
    });
  }

  printBill() {
    this.router.navigate(['/bills']);
  }

  voidTab() {
    const tab = this.tab();
    if (!tab) return;

    Swal.fire({
      title: 'Void Tab?',
      text: 'This will void the tab and release the table. Cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Void',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then(result => {
      if (result.isConfirmed) {
        this.tabsApi.voidTab(tab.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Tab Voided', timer: 1500, showConfirmButton: false });
            this.router.navigate(['/tables']);
          },
          error: () => Swal.fire({ icon: 'error', title: 'Void Failed', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  getSubtotal(): number {
    return this.orders().reduce((sum, item) => {
      const price = item.priceKobo || item.price_kobo || item.unit_price_kobo || 0;
      return sum + (price * (item.quantity || item.qty || 1));
    }, 0);
  }

  getVat(): number {
    return this.getSubtotal() * 0.075;
  }

  getServiceCharge(): number {
    return 0;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getVat() + this.getServiceCharge();
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTimeAgo(date: Date | string): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = Math.floor((now - then) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} minutes ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }

  trackById(_index: number, item: { id: string }) {
    return item.id;
  }
}
