import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TabsApiService, TablesApiService, PosApiService, OfflineCacheService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';
import { interval, Subscription, switchMap, map } from 'rxjs';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tabService = inject(TabsApiService);
  private tableService = inject(TablesApiService);
  private http = inject(HttpClient);
  private posApi = inject(PosApiService);
  private currency = inject(CurrencyContextService);
  private offlineData = inject(OfflineDataService);
  private cache = inject(OfflineCacheService);

  tabId = signal('');
  table = signal<Table | null>(null);
  tabType = signal<string>('');
  bill = signal<Bill | null>(null);
  items = computed(() => this.bill()?.orderItems ?? []);
  isTakeaway = computed(() => this.tabType() === 'takeaway');

  pendingCount = computed(() => this.items().filter(i => {
    const raw = i as any;
    const s = (raw.orderStatus ?? raw.order_status ?? '').toString().toLowerCase();
    const billable = s !== 'declined' && s !== 'cancelled';
    const fulfilled = s === 'delivered' || s === 'completed';
    return billable && !fulfilled && s !== 'pending_payment_approval';
  }).length);
  isLoading = signal(true);
  selectedMethod: 'cash' | 'card' | 'transfer' | 'ussd' = 'cash';
  currentAmount = signal('0');
  isEditingAmount = false;
  isProcessing = signal(false);
  isSuccess = signal(false);
  isAutoConfirmed = signal(false);
  terminals = signal<any[]>([]);
  selectedTerminalId = signal('');
  selectedTerminalLabel = computed(() => {
    const id = this.selectedTerminalId();
    if (!id) return '';
    return this.terminals().find(t => t.id === id)?.label ?? '';
  });

  private pollSubscription?: Subscription;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTableInfo(id);
        this.loadBill(id);
      }
    });
  }

  ngOnDestroy() {
    this.stopPaymentPolling();
  }

  loadTableInfo(tabId: string) {
    this.offlineData.getTab(tabId).subscribe({
      next: (tab: Tab | null) => {
        if (tab) {
          this.tabType.set((tab as any).tabType ?? (tab as any).tab_type ?? '');
          if (tab.tableId) {
            this.offlineData.getTable(tab.tableId).subscribe({
              next: (table) => { if (table) this.table.set(table); }
            });
          }
        }
      }
    });
  }

  private loadBill(tabId: string) {
    this.offlineData.getBill(tabId).subscribe({
      next: (b) => {
        if (b) {
          this.setLoadedBill(b, tabId);
          return;
        }
        // No bill row exists yet (the waiter opened Payment straight after
        // ordering) — generate one from the current orders, mirroring the Bill
        // screen, so the total is never left at zero. Offline generations fall
        // back to whatever is cached.
        this.offlineData.generateBill(tabId).then((gen: any) => {
          if (gen && !gen.offline && gen.id) {
            this.setLoadedBill(gen, tabId);
          } else {
            this.loadCachedBill(tabId);
          }
        }).catch(() => this.loadCachedBill(tabId));
      },
      error: () => this.loadCachedBill(tabId),
    });
  }

  private setLoadedBill(b: Bill, tabId: string) {
    this.bill.set(b);
    this.currentAmount.set((b.totalKobo / 100).toFixed(2));
    this.isLoading.set(false);
    this.startPaymentPolling(tabId);
  }

  private loadCachedBill(tabId: string) {
    this.cache.getByIndex<Bill>('bills', 'tab_id', tabId).pipe(
      map(bills => {
        const sorted = [...(bills || [])].sort((a, b) =>
          (new Date((b as any).createdAt ?? 0) as any) - (new Date((a as any).createdAt ?? 0) as any));
        return sorted.length > 0 ? sorted[0] : null;
      })
    ).subscribe(cached => {
      if (cached) {
        this.bill.set(cached);
        this.currentAmount.set((cached.totalKobo / 100).toFixed(2));
      }
      this.isLoading.set(false);
      this.startPaymentPolling(tabId);
    });
  }

  private startPaymentPolling(tabId: string) {
    this.stopPaymentPolling();
    this.pollSubscription = interval(5000).pipe(
      switchMap(() => this.offlineData.getBill(tabId)),
    ).subscribe({
      next: (data: any) => {
        const b = data as Bill | null;
        if (b && b.paidAt) {
          this.bill.set(b);
          this.isSuccess.set(true);
          this.isAutoConfirmed.set(true);
          this.stopPaymentPolling();
          setTimeout(() => {
            this.router.navigate(['/tabs/payment-success', this.tabId()], {
              state: {
                terminalLabel: this.selectedTerminalLabel(),
                showConfetti: true,
              }
            });
          }, 1000);
        }
      },
      error: () => {},
    });
  }

  private stopPaymentPolling() {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  get totalDueNaira(): string {
    return this.totalDue;
  }

  get formattedAmount(): string {
    const parts = this.currentAmount().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  currencySymbol = computed(() => this.currency.getSymbol());
  currencyCode = computed(() => this.currency.getCode());

  get totalDue(): string {
    const total = (this.bill()?.totalKobo ?? 0) / 100;
    return total.toLocaleString(this.currency.getLocale(), { minimumFractionDigits: 2 });
  }

  formatAmount(amount: string | number): string {
    return (typeof amount === 'string' ? parseFloat(amount) || 0 : amount).toLocaleString(this.currency.getLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  selectMethod(method: 'cash' | 'card' | 'transfer' | 'ussd') {
    this.selectedMethod = method;
    if (method !== 'cash') {
      this.loadActiveTerminals();
    }
  }

  loadActiveTerminals() {
    this.posApi.getActive().subscribe({
      next: (data) => this.terminals.set(Array.isArray(data) ? data : []),
    });
  }

  appendNumber(num: string) {
    if (!this.isEditingAmount) {
      this.currentAmount.set('');
      this.isEditingAmount = true;
    }
    let clean = this.currentAmount().replace(/,/g, '');
    if (num === '.' && clean.includes('.')) return;
    this.currentAmount.set(clean + num);
  }

  clearLast() {
    let clean = this.currentAmount().replace(/,/g, '').slice(0, -1);
    this.currentAmount.set(clean || '0');
    if (!clean) this.isEditingAmount = false;
  }

  confirmPayment() {
    if (this.pendingCount() > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Items Still Pending',
        text: `${this.pendingCount()} item${this.pendingCount() === 1 ? ' is' : 's are'} still pending fulfillment. Deliver all ordered items before settling this tab.`,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#f97316',
        confirmButtonText: 'Back to Order',
      }).then(() => {
        this.router.navigate(['/tabs/detail', this.tabId()]);
      });
      return;
    }
      if (this.selectedMethod !== 'cash' && !this.selectedTerminalId()) {
        Swal.fire({ icon: 'warning', title: 'Terminal Required', text: 'Please select a POS terminal to process this payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
        return;
      }

    Swal.fire({
      title: 'Confirm Payment?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 12px;">Once confirmed, this transaction <strong>cannot be reversed</strong> through the terminal. Any refund or adjustment must be handled by management.</p>
          <p style="margin:0 0 12px;">Please verify the following before proceeding:</p>
          <ul style="padding-left:18px;margin:0 0 12px;">
            <li>The amount entered is correct.</li>
            <li>The payment method selected matches what the guest is using.</li>
          </ul>
          <p style="margin:0;opacity:0.7;font-size:12px;">By confirming, you accept responsibility for this transaction.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete Payment',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      background: '#1e293b',
      color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;

      this.isProcessing.set(true);
      const amount = Math.round(parseFloat(this.currentAmount().replace(/,/g, '')) * 100);
      const apiMethod = this.selectedMethod === 'ussd' ? 'transfer' : this.selectedMethod;

      this.offlineData.recordPayment(this.tabId(), {
        amount,
        method: apiMethod,
        terminal_id: this.selectedMethod !== 'cash' ? this.selectedTerminalId() : undefined,
      }).then(() => {
        this.isProcessing.set(false);
        this.isSuccess.set(true);
        this.startPaymentPolling(this.tabId());
        setTimeout(() => this.router.navigate(['/tabs/payment-success', this.tabId()], {
          state: {
            terminalLabel: this.selectedTerminalLabel(),
            showConfetti: true,
          }
        }), 1000);
      }).catch(() => {
        this.isProcessing.set(false);
        Swal.fire({ icon: 'error', title: 'Payment Failed', text: 'Could not process payment. Please try again.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      });
    });
  }

  getButtonText(): string {
    if (this.isProcessing()) return 'Processing...';
    if (this.isSuccess()) return this.isAutoConfirmed() ? 'Payment Auto-Confirmed' : 'Payment Successful ✓';
    return 'Confirm Payment';
  }

  goBack() {
    this.stopPaymentPolling();
    this.router.navigate(['/tabs/bill', this.tabId()]);
  }

  addItems() {
    this.stopPaymentPolling();
    this.router.navigate(['/menu'], {
      queryParams: { tabId: this.tabId() }
    });
  }

  get currentRole(): string {
    return (localStorage.getItem('userRole') || '').toLowerCase();
  }

  get canConfirmCashAtCounter(): boolean {
    return ['supervisor', 'manager', 'owner'].includes(this.currentRole);
  }

  isCashPending = computed(() => {
    const b = this.bill() as any;
    if (!b || b.paidAt) return false;
    const status = b.paymentStatus ?? b.payment_status;
    const method = b.method;
    return status === 'pending_cash' || (status === 'pending' && method === 'cash');
  });

  get showCounterCashConfirm(): boolean {
    return this.isCashPending() && this.canConfirmCashAtCounter;
  }

  confirmCashAtCounter() {
    if (this.isProcessing() || (this.bill() as any)?.paidAt) return;
    this.isProcessing.set(true);
    const url = `${environment.apiUrl}/api/v1/bills/tab/${this.tabId()}/confirm-cash`;
    this.http.post<any>(url, {}).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isSuccess.set(true);
        this.isAutoConfirmed.set(true);
        setTimeout(() => this.router.navigate(['/tabs/payment-success', this.tabId()], {
          state: { terminalLabel: 'Cash (Counter)', showConfetti: true }
        }), 1000);
      },
      error: (err) => {
        this.isProcessing.set(false);
        const msg = err?.error?.message || err?.message || 'Could not confirm the cash payment.';
        Swal.fire({ icon: 'error', title: 'Confirmation Failed', text: msg, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      }
    });
  }
}
