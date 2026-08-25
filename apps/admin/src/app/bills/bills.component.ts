import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillsApiService, TabsApiService, OrdersApiService, UserApiService, ReportsApiService, MenuApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, OrderItem, User, SalesEntry, MenuItem } from '@serveiq/shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../core/currency-context.service';

type StatusFilter = 'all' | 'paid' | 'pending';
type SourceFilter = 'all' | 'receipt' | 'generated' | 'computed';
type SortField = 'total' | 'date' | 'items' | 'waiter';
type SortDir = 'asc' | 'desc';

interface BillWithTab {
  bill: Bill;
  tab: Tab;
  source: 'receipt' | 'generated' | 'computed';
}

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bills-page">
      <header class="page-header">
        <div class="title-group">
          <h1 class="page-title">Bills & Payments</h1>
          <p class="page-subtitle">View and manage all billing records across your venue.</p>
        </div>

        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-label">Total Revenue</span>
            <span class="summary-value">{{ filteredTotalFormatted() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ filteredSortedBills().length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Paid</span>
            <span class="summary-value accent">{{ filteredPaidCount() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Pending</span>
            <span class="summary-value">{{ filteredPendingCount() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Loaded</span>
            <span class="summary-value muted">{{ allBills().length }}</span>
          </div>
        </div>

        <div class="toolbar">
          <div class="search-wrap">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              class="search-input"
              placeholder="Search by Tab ID, Table, or Bill..."
              [(ngModel)]="searchQuery"
            />
            <button *ngIf="searchQuery()" class="clear-btn" (click)="searchQuery.set('')">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="filters">
            <select class="filter-select" [(ngModel)]="statusFilter">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>

            <select class="filter-select" [(ngModel)]="sourceFilter">
              <option value="all">All Sources</option>
              <option value="receipt">Receipt</option>
              <option value="generated">Live</option>
              <option value="computed">Estimate</option>
            </select>

            <select class="filter-select" [(ngModel)]="waiterFilter">
              <option value="">All Waiters</option>
              @for (w of waiterOptions(); track w.id) {
                <option [value]="w.id">{{ w.name }}</option>
              }
            </select>

            <select class="filter-select" [(ngModel)]="sortField">
              <option value="total">Sort: Total</option>
              <option value="date">Sort: Date</option>
              <option value="items">Sort: Items</option>
              <option value="waiter">Sort: Waiter</option>
            </select>

            <button class="sort-dir-btn" (click)="toggleSortDir()" title="Toggle order">
              <span class="material-symbols-outlined">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
            </button>
          </div>
        </div>
      </header>

      <div *ngIf="isLoading()" class="skeleton-list">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-shimmer skeleton-row"></div>
      </div>

      <section class="table-card" *ngIf="!isLoading()">
        <div class="table-wrapper">
          <table class="bills-table">
            <thead>
              <tr>
                <th>Tab / Table</th>
                <th class="sortable" (click)="setSort('waiter')">Waiter <span class="sort-arrow" *ngIf="sortField() === 'waiter'">{{ sortDir() === 'asc' ? '▲' : '▼' }}</span></th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Service Chg</th>
                <th class="sortable" (click)="setSort('total')">Total <span class="sort-arrow" *ngIf="sortField() === 'total'">{{ sortDir() === 'asc' ? '▲' : '▼' }}</span></th>
                <th>Method</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of filteredSortedBills(); track entry.tab.id) {
                <tr class="bill-row">
                  <td>
                    <code>{{ entry.tab.id.slice(0, 8) }}...</code>
                    <span class="table-label">T-{{ entry.tab.tableId.slice(0, 4) }}</span>
                  </td>
                  <td>{{ waiterMap()[entry.tab.waiterId || ''] || '—' }}</td>
                  <td>{{ (entry.bill.orderItems || []).length }}</td>
                  <td>{{ formatKobo(entry.bill.subtotalKobo) }}</td>
                  <td>{{ entry.bill.serviceChargePercent || 5 }}%</td>
                  <td class="cell-total">{{ formatKobo(entry.bill.totalKobo) }}</td>
                  <td>
                    <span class="method-badge" *ngIf="entry.bill.paymentMethod">
                      {{ entry.bill.paymentMethod | titlecase }}
                    </span>
                    <span class="method-badge unpaid" *ngIf="!entry.bill.paymentMethod">—</span>
                  </td>
                  <td>
                    <span class="status-badge" [class.paid]="entry.bill.paidAt">
                      {{ entry.bill.paidAt ? 'Paid' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <span class="source-badge" [class]="entry.source">
                      {{ entry.source === 'receipt' ? 'Receipt' : entry.source === 'generated' ? 'Live' : 'Estimate' }}
                    </span>
                  </td>
                  <td class="cell-actions">
                    <button class="action-btn" (click)="viewReceipt(entry)" title="View Details">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="10" class="empty-state">{{ bills().length ? 'No match for current filters.' : 'No bills found.' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .bills-page { padding: 40px 48px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .page-header { margin-bottom: 32px; display: flex; flex-direction: column; gap: 16px; }
    .title-group { display: flex; flex-direction: column; gap: 8px; }
    .page-title { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 700; color: var(--on-surface); }
    @media (max-width: 768px) { .page-title { font-size: 1.5rem; } }
    .page-subtitle { margin: 0; font-size: 1rem; color: var(--secondary); }

    .summary-bar { display: flex; gap: 32px; flex-wrap: wrap; background: var(--surface-container); border-radius: 16px; padding: 20px 24px; }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); }
    .summary-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-background); }
    .summary-value.accent { color: var(--primary); }
    .summary-value.muted { color: var(--secondary); font-size: 1.25rem; }

    .toolbar { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 240px; }
    .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--secondary); pointer-events: none; }
    .search-input { width: 100%; padding: 10px 36px 10px 44px; border: 1px solid var(--outline-variant); border-radius: 12px; background: var(--surface-container-low); color: var(--on-background); font-size: 0.9375rem; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; &::placeholder { color: var(--secondary); } &:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); } }
    .clear-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--secondary); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; &:hover { background: var(--surface-variant); } .material-symbols-outlined { font-size: 18px; } }

    .filters { display: flex; gap: 8px; align-items: center; }
    .filter-select { padding: 10px 36px 10px 14px; border: 1px solid var(--outline-variant); border-radius: 12px; background: var(--surface-container-low); color: var(--on-background); font-size: 0.875rem; font-family: 'Inter', sans-serif; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23575e70' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; &:focus { border-color: var(--primary); } &:hover { border-color: var(--primary); } }

    .sort-dir-btn { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--outline-variant); border-radius: 12px; background: var(--surface-container-low); color: var(--secondary); cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--primary); color: var(--primary); } .material-symbols-outlined { font-size: 20px; } }

    .skeleton-list { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-shimmer { background: linear-gradient(90deg, var(--surface-container-low) 25%, var(--surface-container-high) 50%, var(--surface-container-low) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
    .skeleton-row { height: 64px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .table-card { background: var(--surface-container-lowest); border-radius: 24px; border: 1px solid var(--outline-variant); box-shadow: 0 8px 32px rgba(11,28,48,0.04); overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .bills-table { width: 100%; border-collapse: collapse; }
    .bills-table th { text-align: left; padding: 20px 24px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); background: var(--surface-container-low); }
    .bills-table td { padding: 20px 24px; border-bottom: 1px solid var(--outline-variant); color: var(--secondary); font-size: 0.9375rem; }
    .bill-row:hover { background: var(--surface-container-low); }
    .sortable { cursor: pointer; user-select: none; &:hover { color: var(--primary); } }
    .sort-arrow { font-size: 0.65rem; margin-left: 4px; }

    .table-label { display: inline-block; margin-left: 8px; font-size: 0.8rem; font-weight: 600; color: var(--primary); }
    .cell-total { font-weight: 700; color: var(--on-surface); }

    .method-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; background: color-mix(in srgb, var(--tertiary) 20%, transparent); color: var(--tertiary); }
    .method-badge.unpaid { background: var(--error-container); color: var(--on-error-container); }

    .status-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; background: var(--error-container); color: var(--on-error-container); }
    .status-badge.paid { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }

    .source-badge { padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .source-badge.receipt { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .source-badge.generated { background: color-mix(in srgb, var(--tertiary) 15%, transparent); color: var(--tertiary); }
    .source-badge.computed { background: color-mix(in srgb, var(--secondary) 15%, transparent); color: var(--secondary); }

    .cell-actions { display: flex; gap: 8px; }
    .action-btn { background: transparent; border: none; color: var(--secondary); cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; svg { width: 18px; height: 18px; } &:hover { color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); } }

    .empty-state { text-align: center; padding: 48px; color: var(--secondary); font-size: 1rem; }
  `]
})
export class BillsComponent implements OnInit {
  private billsApi = inject(BillsApiService);
  private tabsApi = inject(TabsApiService);
  private ordersApi = inject(OrdersApiService);
  private userApi = inject(UserApiService);
  private reportsApi = inject(ReportsApiService);
  private menuApi = inject(MenuApiService);
  private currency = inject(CurrencyContextService);
  private menuItems = signal<MenuItem[]>([]);

  allBills = signal<BillWithTab[]>([]);
  waiterMap = signal<Record<string, string>>({});
  reportTotalKobo = signal(0);
  reportTransactionCount = signal(0);
  isLoading = signal(true);

  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('all');
  sourceFilter = signal<SourceFilter>('all');
  waiterFilter = signal('');
  waiterOptions = signal<{ id: string; name: string }[]>([]);
  sortField = signal<SortField>('total');
  sortDir = signal<SortDir>('desc');

  bills = this.allBills.asReadonly();

  filteredSortedBills = computed(() => {
    let list = this.allBills();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const source = this.sourceFilter();
    const wf = this.waiterFilter();
    const field = this.sortField();
    const dir = this.sortDir();

    if (query) {
      list = list.filter(e =>
        e.tab.id.toLowerCase().includes(query) ||
        (e.tab.tableId || '').toLowerCase().includes(query) ||
        (e.bill.id || '').toLowerCase().includes(query)
      );
    }

    if (status !== 'all') {
      list = list.filter(e => status === 'paid' ? !!e.bill.paidAt : !e.bill.paidAt);
    }

    if (source !== 'all') {
      list = list.filter(e => e.source === source);
    }

    if (wf) {
      list = list.filter(e => e.tab.waiterId === wf);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (field === 'total') cmp = a.bill.totalKobo - b.bill.totalKobo;
      else if (field === 'date') cmp = new Date(a.bill.createdAt || 0).getTime() - new Date(b.bill.createdAt || 0).getTime();
      else if (field === 'items') cmp = (a.bill.orderItems || []).length - (b.bill.orderItems || []).length;
      else if (field === 'waiter') {
        const na = this.waiterMap()[a.tab.waiterId || ''] || '';
        const nb = this.waiterMap()[b.tab.waiterId || ''] || '';
        cmp = na.localeCompare(nb);
      }
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  filteredTotalFormatted = computed(() => {
    const total = this.filteredSortedBills()
      .filter(e => !!e.bill.paidAt)
      .reduce((s, e) => s + e.bill.totalKobo, 0);
    return this.currency.formatKobo(total);
  });

  filteredPaidCount = computed(() => this.filteredSortedBills().filter(e => !!e.bill.paidAt).length);
  filteredPendingCount = computed(() => this.filteredSortedBills().filter(e => !e.bill.paidAt).length);

  ngOnInit() {
    this.loadAllBills();
  }

  private loadAllBills() {
    forkJoin({
      tabs: this.tabsApi.getAllTabsUnpaginated().pipe(catchError(() => of([]))),
      waiters: this.userApi.listWaiters().pipe(catchError(() => of([]))),
      waiterList: this.tabsApi.getWaiterList().pipe(catchError(() => of([]))),
      sales: this.reportsApi.getSales().pipe(catchError(() => of([]))),
      menuItems: this.menuApi.getAllItems().pipe(catchError(() => of([]))),
    }).subscribe(({ tabs, waiters, waiterList, sales, menuItems }) => {
      const map: Record<string, string> = {};
      (waiters as User[]).forEach(w => { map[w.id] = w.fullName; });
      (waiterList as { id: string; fullName: string; role: string }[]).forEach(w => { if (!map[w.id]) map[w.id] = w.fullName; });
      this.waiterMap.set(map);

      this.waiterOptions.set(
        (waiterList as { id: string; fullName: string; role: string }[])
          .map(w => ({ id: w.id, name: w.fullName }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      this.menuItems.set(Array.isArray(menuItems) ? (menuItems as MenuItem[]) : []);

      const entries = sales as SalesEntry[];
      const totalKobo = entries.reduce((s, e) => s + (e.revenueKobo || 0), 0);
      const totalTx = entries.reduce((s, e) => s + (e.orderCount || 0), 0);
      this.reportTotalKobo.set(totalKobo);
      this.reportTransactionCount.set(totalTx);

      if (!tabs.length) {
        this.isLoading.set(false);
        return;
      }
      const requests = (tabs as Tab[]).map(tab =>
        this.loadBillForTab(tab).pipe(catchError(() => of(null as BillWithTab | null)))
      );
      forkJoin(requests).subscribe(results => {
        this.allBills.set(results.filter((r): r is BillWithTab => r !== null));
        this.isLoading.set(false);
      });
    });
  }

  private loadBillForTab(tab: Tab) {
    return this.billsApi.getByTab(tab.id).pipe(
      switchMap(bill => {
        if (bill) return this.fetchOrdersAndWrap(tab, bill, 'receipt');
        // Read-only estimate. Do NOT call billsApi.generate here — it persists a
        // bill and flips the tab to 'billed' as a side effect of viewing this page.
        return this.ordersApi.getByTab(tab.id).pipe(
          map(items => this.wrapComputed(tab, items)),
        );
      }),
      catchError(() => of(null as BillWithTab | null))
    );
  }

  private fetchOrdersAndWrap(tab: Tab, bill: Bill, source: 'receipt' | 'generated') {
    return this.ordersApi.getByTab(tab.id).pipe(
      map(items => {
        const normalized = items.map(o => this.normalizeOrderItem(o));
        return { bill: { ...bill, orderItems: normalized }, tab, source } as BillWithTab;
      }),
      catchError(() => of({ bill, tab, source } as BillWithTab))
    );
  }

  private normalizeOrderItem(o: any): any {
    return {
      ...o,
      menuItemId: o.menuItemId ?? o.menu_item_id ?? '',
      menuItemName: o.menuItemName || o.menu_item_name || o.menuItem?.name || o.menu_item?.name || '',
      priceKobo: o.priceKobo ?? o.price_kobo ?? o.unitPriceKobo ?? o.unit_price_kobo ?? 0,
      quantity: o.quantity ?? o.qty ?? 1,
    };
  }

  private getItemName(item: any): string {
    const name = item.menuItemName || item.menu_item_name || '';
    if (name) return name;
    const id = item.menuItemId ?? item.menu_item_id ?? '';
    if (!id) return 'Item';
    const found = this.menuItems().find(m => m.id === id);
    return found?.name || id.slice(0, 8);
  }

  private wrapComputed(tab: Tab, items: OrderItem[]): BillWithTab {
    const bill = this.computeBillFromOrders(tab.id, items);
    return { bill, tab, source: 'computed' };
  }

  private computeBillFromOrders(tabId: string, items: OrderItem[]): Bill {
    const subtotalKobo = items.reduce((s, o) => s + (o.priceKobo || 0) * (o.quantity || 1), 0);
    const serviceChargeKobo = Math.round(subtotalKobo * 0.05);
    const totalKobo = subtotalKobo + serviceChargeKobo;
    return {
      id: '', tabId, branchId: '', subtotalKobo, serviceChargeKobo,
      serviceChargePercent: 5, discountKobo: 0, totalKobo, createdAt: new Date(), orderItems: items,
    };
  }

  toggleSortDir() {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  setSort(field: SortField) {
    if (this.sortField() === field) {
      this.toggleSortDir();
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  viewReceipt(entry: BillWithTab) {
    const bill = entry.bill;
    const items = bill.orderItems || [];
    const itemList = items.slice(0, 5).map(i =>
      `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:13px">
        <span>${this.getItemName(i)} x${i.quantity || 1}</span>
          <span>${this.formatKobo((i.priceKobo || 0) * (i.quantity || 1))}</span>
       </div>`
    ).join('');

    const fullBillId = bill.id || entry.tab.id;
    const truncatedId = fullBillId.length > 13 ? fullBillId.slice(0, 8) + '...' + fullBillId.slice(-4) : fullBillId;

    const waiterName = this.waiterMap()[entry.tab.waiterId || ''] || '—';

    Swal.fire({
      title: entry.source === 'computed' ? 'Estimated Bill' : 'Bill Summary',
      html: `
        <div style="text-align:left;font-family:monospace;font-size:0.85rem">
          <p><strong>Bill ID:</strong>
            <span style="font-size:12px">${truncatedId}</span>
            <button data-copy="${fullBillId}" style="background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:4px;font-size:14px;transition:all 0.2s;vertical-align:middle" title="Copy full ID"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">content_copy</span></button>
          </p>
          <p><strong>Tab:</strong> ${entry.tab.id.slice(0, 8)}...</p>
          <p><strong>Status:</strong> ${bill.paidAt ? 'Paid on ' + new Date(bill.paidAt).toLocaleDateString() : 'Pending'}</p>
          <p><strong>Source:</strong> ${entry.source === 'receipt' ? 'Paid Receipt' : entry.source === 'generated' ? 'Live Bill' : 'Computed from Orders'}</p>
          ${items.length ? `<div style="margin:12px 0"><strong>Items (${items.length}):</strong>${itemList}${items.length > 5 ? `<div style="text-align:center;font-size:12px;color:#999;padding-top:4px">+${items.length - 5} more</div>` : ''}</div>` : ''}
          <hr style="margin:12px 0;border:none;border-top:1px solid #ddd">
          <p><strong>Subtotal:</strong> ${this.formatKobo(bill.subtotalKobo)}</p>
          <p><strong>Service Charge:</strong> ${bill.serviceChargePercent || 5}% (${this.formatKobo(bill.serviceChargeKobo)})</p>
          ${bill.discountKobo ? `<p><strong>Discount:</strong> ${this.formatKobo(bill.discountKobo)}</p>` : ''}
          <p style="font-size:1rem;font-weight:700"><strong>Total:</strong> ${this.formatKobo(bill.totalKobo)}</p>
          <hr style="margin:12px 0;border:none;border-top:1px solid #ddd">
          <p><strong>Generated by:</strong> ${waiterName}</p>
          <p style="font-size:0.75rem;color:#999">Powered by ServeIQ Inc</p>
          <button data-share='${this.escapeHtml(JSON.stringify({ items: items.map(i => ({ name: this.getItemName(i), qty: i.quantity || 1, price: (i.priceKobo || 0) * (i.quantity || 1) })), subtotal: bill.subtotalKobo, serviceCharge: bill.serviceChargeKobo, discount: bill.discountKobo, total: bill.totalKobo, waiterName }))}' style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:8px;background:#25D366;color:#fff;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:sans-serif">
            <span>Share to WhatsApp</span>
          </button>
        </div>
      `,
      confirmButtonText: 'Close',
      width: 520,
      didOpen: () => {
        const container = Swal.getHtmlContainer();
        if (!container) return;
        container.querySelectorAll('[data-copy]').forEach(el => {
          el.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const val = target.getAttribute('data-copy') || '';
            navigator.clipboard.writeText(val);
            target.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;color:#4be277">check</span>';
            setTimeout(() => { target.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">content_copy</span>'; }, 1500);
          });
        });
        container.querySelectorAll('[data-share]').forEach(el => {
          el.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const raw = target.getAttribute('data-share') || '{}';
            try {
              const data = JSON.parse(raw);
              const lines = [
                `*ServeIQ Receipt*`,
                ``,
                `*Items:*`,
                ...data.items.map((i: any) => `${i.name} x${i.qty} — ${this.currency.formatKobo(i.price)}`),
                ``,
                `Subtotal: ${this.currency.formatKobo(data.subtotal)}`,
                `Service Charge: ${this.currency.formatKobo(data.serviceCharge)}`,
                ...(data.discount ? [`Discount: -${this.currency.formatKobo(data.discount)}`] : []),
                `*Total: ${this.currency.formatKobo(data.total)}*`,
                ``,
                `Generated by: ${data.waiterName}`,
                `Powered by ServeIQ Inc`,
              ];
              const text = lines.join('\n');
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            } catch {}
          });
        });
      }
    });
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
