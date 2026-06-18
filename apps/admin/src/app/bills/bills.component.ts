import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillsApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

interface BillWithTab {
  bill: Bill;
  tab?: Tab;
}

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bills-page">
      <!-- Header -->
      <header class="page-header">
        <div class="title-group">
          <h1 class="page-title">Bills & Payments</h1>
          <p class="page-subtitle">View and manage all billing records across your venue.</p>
        </div>
      </header>

      <!-- Loading Skeleton -->
      <div *ngIf="isLoading()" class="skeleton-list">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-shimmer skeleton-row"></div>
      </div>

      <!-- Bills Table -->
      <section class="table-card" *ngIf="!isLoading()">
        <div class="table-wrapper">
          <table class="bills-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Tab / Table</th>
                <th>Subtotal</th>
                <th>Service Charge</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of bills()" class="bill-row">
                <td class="cell-id">
                  <code>{{ entry.bill.id.slice(0, 8) }}...</code>
                </td>
                <td>{{ entry.bill.tabId.slice(0, 8) }}...</td>
                <td>₦{{ formatKobo(entry.bill.subtotalKobo) }}</td>
                <td>{{ entry.bill.serviceChargePercent }}%</td>
                <td class="cell-total">₦{{ formatKobo(entry.bill.totalKobo) }}</td>
                <td>
                  <span class="method-badge" *ngIf="entry.bill.paymentMethod">
                    {{ entry.bill.paymentMethod | titlecase }}
                  </span>
                  <span class="method-badge unpaid" *ngIf="!entry.bill.paymentMethod">Unpaid</span>
                </td>
                <td>
                  <span class="status-badge" [class.paid]="entry.bill.paidAt">
                    {{ entry.bill.paidAt ? 'Paid' : 'Pending' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="action-btn" (click)="viewReceipt(entry.bill)" title="View Receipt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="bills().length === 0">
                <td colspan="8" class="empty-state">No bills found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .bills-page { padding: 40px 48px; max-width: 1600px; margin: 0 auto; font-family: 'Inter', sans-serif; }

    .page-header { margin-bottom: 40px; }
    .title-group { display: flex; flex-direction: column; gap: 8px; }
    .page-title { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 700; color: #0b1c30; }
    .page-subtitle { margin: 0; font-size: 1rem; color: #64748b; }

    .skeleton-list { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-shimmer { background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
    .skeleton-row { height: 64px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .table-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 8px 32px rgba(11,28,48,0.04); overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .bills-table { width: 100%; border-collapse: collapse; }
    .bills-table th { text-align: left; padding: 20px 24px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; background: #f8fafc; }
    .bills-table td { padding: 20px 24px; border-bottom: 1px solid #f8fafc; color: #334155; font-size: 0.9375rem; }
    .bill-row:hover { background: #fcfdfe; }

    .cell-id code { font-family: monospace; font-size: 0.8rem; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; }
    .cell-total { font-weight: 700; color: #0b1c30; }

    .method-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; background: #e0f2fe; color: #0369a1; }
    .method-badge.unpaid { background: #fef2f2; color: #991b1b; }

    .status-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; background: #fef2f2; color: #991b1b; }
    .status-badge.paid { background: #e7f9ed; color: #166534; }

    .cell-actions { display: flex; gap: 8px; }
    .action-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; svg { width: 18px; height: 18px; } &:hover { color: #F97316; background: #fdf5f1; } }

    .empty-state { text-align: center; padding: 48px; color: #94a3b8; font-size: 1rem; }
  `]
})
export class BillsComponent implements OnInit {
  private billsApi = inject(BillsApiService);
  private tabsApi = inject(TabsApiService);

  bills = signal<BillWithTab[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    // Load all open tabs then fetch their bills
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs: Tab[]) => {
        const billEntries: BillWithTab[] = [];
        let pending = tabs.length;
        if (pending === 0) { this.isLoading.set(false); return; }

        tabs.forEach((tab: Tab) => {
          this.billsApi.getByTab(tab.id).subscribe({
            next: (bill) => {
              billEntries.push({ bill, tab });
            },
            error: () => {},
            complete: () => {
              pending--;
              if (pending === 0) {
                this.bills.set(billEntries);
                this.isLoading.set(false);
              }
            }
          });
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  viewReceipt(bill: Bill) {
    Swal.fire({
      title: 'Bill Summary',
      html: `
        <div style="text-align:left;font-family:monospace;font-size:0.9rem">
          <p><strong>Bill ID:</strong> ${bill.id}</p>
          <p><strong>Subtotal:</strong> ₦${this.formatKobo(bill.subtotalKobo)}</p>
          <p><strong>Service Charge:</strong> ${bill.serviceChargePercent}%</p>
          <p><strong>Discount:</strong> ₦${this.formatKobo(bill.discountKobo)}</p>
          <p><strong>Total:</strong> ₦${this.formatKobo(bill.totalKobo)}</p>
          <p><strong>Status:</strong> ${bill.paidAt ? 'Paid on ' + new Date(bill.paidAt).toLocaleDateString() : 'Pending'}</p>
        </div>
      `,
      confirmButtonColor: '#F97316',
      confirmButtonText: 'Close',
      width: 480
    });
  }
}
