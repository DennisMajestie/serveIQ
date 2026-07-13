import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillsApiService, TabsApiService, OrdersApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, OrderItem } from '@serveiq/shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface BillWithTab {
  bill: Bill;
  tab: Tab;
  source: 'receipt' | 'generated' | 'computed';
}

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bills-page">
      <header class="page-header">
        <div class="title-group">
          <h1 class="page-title">Bills & Payments</h1>
          <p class="page-subtitle">View and manage all billing records across your venue.</p>
        </div>
        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-label">Total (loaded bills)</span>
            <span class="summary-value">{{ totalFormatted() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ bills().length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Paid</span>
            <span class="summary-value accent">{{ paidCount() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Pending</span>
            <span class="summary-value">{{ pendingCount() }}</span>
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
                <th>Items</th>
                <th>Subtotal</th>
                <th>Service Chg</th>
                <th>Total</th>
                <th>Method</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of bills()" class="bill-row">
                <td>
                  <code>{{ entry.tab.id.slice(0, 8) }}...</code>
                  <span class="table-label">T-{{ entry.tab.tableId?.slice(0, 4) || '??' }}</span>
                </td>
                <td>{{ (entry.bill.orderItems || []).length }}</td>
                <td>₦{{ formatKobo(entry.bill.subtotalKobo) }}</td>
                <td>{{ entry.bill.serviceChargePercent || 5 }}%</td>
                <td class="cell-total">₦{{ formatKobo(entry.bill.totalKobo) }}</td>
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
              <tr *ngIf="bills().length === 0">
                <td colspan="9" class="empty-state">No bills found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .bills-page { padding: 40px 48px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .page-header { margin-bottom: 32px; display: flex; flex-direction: column; gap: 24px; }
    .title-group { display: flex; flex-direction: column; gap: 8px; }
    .page-title { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 700; color: var(--on-surface); }
    .page-subtitle { margin: 0; font-size: 1rem; color: var(--secondary); }

    .summary-bar { display: flex; gap: 32px; flex-wrap: wrap; background: var(--surface-container); border-radius: 16px; padding: 20px 24px; }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); }
    .summary-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--on-background); }
    .summary-value.accent { color: var(--primary); }

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

  bills = signal<BillWithTab[]>([]);
  isLoading = signal(true);

  totalFormatted = computed(() => {
    const total = this.bills().reduce((s, e) => s + e.bill.totalKobo, 0);
    return '₦' + (total / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  paidCount = computed(() => this.bills().filter(e => !!e.bill.paidAt).length);
  pendingCount = computed(() => this.bills().filter(e => !e.bill.paidAt).length);

  ngOnInit() {
    this.loadAllBills();
  }

  private loadAllBills() {
    this.tabsApi.getAllTabs().pipe(
      catchError(() => of([]))
    ).subscribe((tabs: Tab[]) => {
      if (!tabs.length) {
        this.isLoading.set(false);
        return;
      }

      const requests = tabs.map(tab =>
        this.loadBillForTab(tab).pipe(catchError(() => of(null as BillWithTab | null)))
      );
      forkJoin(requests).subscribe(results => {
        this.bills.set(results.filter((r): r is BillWithTab => r !== null));
        this.isLoading.set(false);
      });
    });
  }

  private loadBillForTab(tab: Tab) {
    // Step 1: Try receipt endpoint (paid bills)
    return this.billsApi.getByTab(tab.id).pipe(
      switchMap(bill => {
        if (bill) {
          return this.fetchOrdersAndWrap(tab, bill, 'receipt');
        }
        // Step 2: No receipt — try generate()
        return this.billsApi.generate(tab.id, { serviceChargePercent: 5 }).pipe(
          switchMap(genBill => this.fetchOrdersAndWrap(tab, genBill, 'generated')),
          catchError(() =>
            // Step 3: Generate failed — compute from orders
            this.ordersApi.getByTab(tab.id).pipe(
              map(items => this.wrapComputed(tab, items)),
            )
          )
        );
      })
    );
  }

  private fetchOrdersAndWrap(tab: Tab, bill: Bill, source: 'receipt' | 'generated') {
    return this.ordersApi.getByTab(tab.id).pipe(
      map(items => ({ bill: { ...bill, orderItems: items }, tab, source }) as BillWithTab),
      catchError(() => of({ bill, tab, source } as BillWithTab))
    );
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
      id: '',
      tabId,
      branchId: '',
      subtotalKobo,
      serviceChargeKobo,
      serviceChargePercent: 5,
      discountKobo: 0,
      totalKobo,
      createdAt: new Date(),
      orderItems: items,
    };
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  viewReceipt(entry: BillWithTab) {
    const bill = entry.bill;
    const items = bill.orderItems || [];
    const itemList = items.slice(0, 5).map(i =>
      `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:13px">
        <span>${i.menuItemName || i.menuItemId?.slice(0, 8) || 'Item'} x${i.quantity || 1}</span>
        <span>₦${this.formatKobo((i.priceKobo || 0) * (i.quantity || 1))}</span>
       </div>`
    ).join('');

    Swal.fire({
      title: entry.source === 'computed' ? 'Estimated Bill' : 'Bill Summary',
      html: `
        <div style="text-align:left;font-family:monospace;font-size:0.85rem">
          <p><strong>Tab:</strong> ${entry.tab.id.slice(0, 8)}...</p>
          <p><strong>Status:</strong> ${bill.paidAt ? 'Paid on ' + new Date(bill.paidAt).toLocaleDateString() : 'Pending'}</p>
          <p><strong>Source:</strong> ${entry.source === 'receipt' ? 'Paid Receipt' : entry.source === 'generated' ? 'Live Bill' : 'Computed from Orders'}</p>
          ${items.length ? `<div style="margin:12px 0"><strong>Items (${items.length}):</strong>${itemList}${items.length > 5 ? `<div style="text-align:center;font-size:12px;color:#999;padding-top:4px">+${items.length - 5} more</div>` : ''}</div>` : ''}
          <hr style="margin:12px 0;border:none;border-top:1px solid #ddd">
          <p><strong>Subtotal:</strong> ₦${this.formatKobo(bill.subtotalKobo)}</p>
          <p><strong>Service Charge:</strong> ${bill.serviceChargePercent || 5}% (₦${this.formatKobo(bill.serviceChargeKobo)})</p>
          ${bill.discountKobo ? `<p><strong>Discount:</strong> ₦${this.formatKobo(bill.discountKobo)}</p>` : ''}
          <p style="font-size:1rem;font-weight:700"><strong>Total:</strong> ₦${this.formatKobo(bill.totalKobo)}</p>
        </div>
      `,
      confirmButtonText: 'Close',
      width: 520
    });
  }
}
