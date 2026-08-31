import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TabsApiService, TablesApiService, PosApiService, OfflineCacheService, BillsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table, AllocationType, PaymentPlanAllocation, CreatePaymentPlanRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';
import { map, interval, Subscription, switchMap } from 'rxjs';

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
  private billsApi = inject(BillsApiService);
  private currency = inject(CurrencyContextService);
  private offlineData = inject(OfflineDataService);
  private cache = inject(OfflineCacheService);

  tabId = signal('');
  table = signal<Table | null>(null);
  bill = signal<Bill | null>(null);
  items = computed(() => this.bill()?.orderItems ?? []);

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

  isSplit = signal(false);
  splitCount = signal(2);
  splitAmounts = signal<number[]>([]);
  maxGuests = signal(0);

  private pollSubscription?: Subscription;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTableInfo(id);
        this.loadTab(id);
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
        if (tab?.tableId) {
          this.offlineData.getTable(tab.tableId).subscribe({
            next: (table) => { if (table) this.table.set(table); }
          });
        }
      }
    });
  }

  private loadTab(tabId: string) {
    this.offlineData.getTab(tabId).subscribe({
      next: (tab: Tab | null) => {
        if (tab) {
          this.maxGuests.set(tab.partySize || 1);
          if (tab.partySize && tab.partySize < this.splitCount()) {
            this.splitCount.set(Math.max(1, tab.partySize));
          }
        }
      }
    });
  }

  private loadBill(tabId: string) {
    this.offlineData.getBill(tabId).subscribe({
      next: (b) => {
        if (b) {
          this.bill.set(b);
          this.currentAmount.set((b.totalKobo / 100).toFixed(2));
          if (this.isSplit()) this.distributeEqually();
        }
        this.isLoading.set(false);
        this.startPaymentPolling(tabId);
      },
      error: () => {
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
            if (this.isSplit()) this.distributeEqually();
          }
          this.isLoading.set(false);
          this.startPaymentPolling(tabId);
        });
      },
    });
  }

  private startPaymentPolling(tabId: string) {
    this.stopPaymentPolling();
    this.pollSubscription = interval(5000).pipe(
      switchMap(() => this.offlineData.getBill(tabId)),
    ).subscribe({
      next: (b) => {
        if (b && b.paidAt) {
          this.bill.set(b);
          this.isSuccess.set(true);
          this.isAutoConfirmed.set(true);
          this.stopPaymentPolling();
          const allocations = this.isSplit() ? this.splitAmounts().map((k, i) => ({ guest: i + 1, amountKobo: k })) : [];
          setTimeout(() => this.router.navigate(['/tabs/payment-success', this.tabId()], {
            state: {
              terminalLabel: this.selectedTerminalLabel(),
              showConfetti: true,
              splitAllocations: allocations,
            }
          }), 1000);
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

  toggleSplit() {
    this.isSplit.set(!this.isSplit());
    if (this.isSplit()) {
      this.distributeEqually();
    }
  }

  changeSplitCount(delta: number) {
    const max = this.maxGuests();
    const current = this.splitCount();
    const proposed = current + delta;
    if (proposed > max) {
      Swal.fire({ icon: 'warning', title: 'Maximum Participants Reached', text: `This table has ${max} guest${max > 1 ? 's' : ''}. You cannot split beyond that.`, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    const newCount = Math.max(1, Math.min(max, proposed));
    this.splitCount.set(newCount);
    this.distributeEqually();
  }

  private distributeEqually() {
    const total = this.bill()?.totalKobo ?? 0;
    const count = this.splitCount();
    const each = Math.floor(total / count);
    const remainder = total - each * count;
    const amounts = Array(count).fill(each);
    amounts[amounts.length - 1] += remainder;
    this.splitAmounts.set(amounts);
  }

  getSplitKobo(index: number): number {
    return this.splitAmounts()[index] ?? 0;
  }

  getRemainingKobo(): number {
    const total = this.bill()?.totalKobo ?? 0;
    const allocated = this.splitAmounts().reduce((sum, a) => sum + a, 0);
    return total - allocated;
  }

  get isSplitValid(): boolean {
    return this.splitAmounts().length === 0 || this.getRemainingKobo() === 0;
  }

  get totalPaidKobo(): number {
    const total = this.bill()?.totalKobo ?? 0;
    return total - this.getRemainingKobo();
  }

  get remainingKobo(): number {
    return this.getRemainingKobo();
  }

  get paidKobo(): number {
    return this.totalPaidKobo;
  }

  customizeSplit(index: number) {
    const currentNaira = (this.splitAmounts()[index] ?? 0) / 100;
    Swal.fire({
      title: `Guest ${index + 1} Amount`,
      html: `
        <div style="margin-bottom: 12px; color: #a0a0a0; font-size: 14px;">Enter amount in ${this.currencySymbol()}</div>
        <input id="split-amount" type="number" step="0.01" value="${currentNaira}"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 24px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box;" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Set',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      didOpen: () => {
        const input = document.getElementById('split-amount') as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
      },
      preConfirm: () => {
        const val = parseFloat((document.getElementById('split-amount') as HTMLInputElement)?.value);
        if (isNaN(val) || val < 0) {
          Swal.showValidationMessage('Enter a valid amount');
          return false;
        }
        if (val * 100 > (this.bill()?.totalKobo ?? 0)) {
          Swal.showValidationMessage('Amount cannot exceed total');
          return false;
        }
        return Math.round(val * 100);
      }
    }).then(result => {
      if (result.isConfirmed) {
        const total = this.bill()?.totalKobo ?? 0;
        const count = this.splitCount();
        const amounts = Array(count).fill(0);
        amounts[index] = result.value;
        if (count > 1) {
          const otherCount = count - 1;
          const remaining = total - result.value;
          const each = Math.floor(remaining / otherCount);
          let distributed = 0;
          for (let i = 0; i < count; i++) {
            if (i === index) continue;
            amounts[i] = each;
            distributed += each;
          }
          const lastOther = [...Array(count).keys()].filter(i => i !== index).pop() as number;
          amounts[lastOther] += remaining - distributed;
        }
        this.splitAmounts.set(amounts);
      }
    });
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
    if (this.isSplit() && !this.isSplitValid) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Allocation', text: 'Allocate the full bill amount across guests before completing payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
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
            <li>Split amounts (if applicable) are fully allocated and accurate.</li>
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
        const allocations = this.isSplit() ? this.splitAmounts().map((k, i) => ({ guest: i + 1, amountKobo: k })) : [];
        setTimeout(() => this.router.navigate(['/tabs/payment-success', this.tabId()], {
          state: {
            terminalLabel: this.selectedTerminalLabel(),
            showConfetti: true,
            splitAllocations: allocations,
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
        const allocations = this.isSplit() ? this.splitAmounts().map((k, i) => ({ guest: i + 1, amountKobo: k })) : [];
        setTimeout(() => this.router.navigate(['/tabs/payment-success', this.tabId()], {
          state: { terminalLabel: 'Cash (Counter)', showConfetti: true, splitAllocations: allocations }
        }), 1000);
      },
      error: (err) => {
        this.isProcessing.set(false);
        const msg = err?.error?.message || err?.message || 'Could not confirm the cash payment.';
        Swal.fire({ icon: 'error', title: 'Confirmation Failed', text: msg, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      }
    });
  }

  createPaymentPlan() {
    const items = this.items().filter(i => {
      const raw = i as any;
      const s = (raw.orderStatus ?? raw.order_status ?? '').toString().toLowerCase();
      return s === 'pending_supervisor_approval';
    });
    if (!items.length) {
      Swal.fire({ icon: 'warning', title: 'No pending items', text: 'No items available to create a payment plan.' });
      return;
    }

    const itemOptions = items.map(i => {
      const raw = i as any;
      const subtotal = (raw.priceKobo ?? raw.price_kobo ?? 0) * (raw.quantity ?? raw.qty ?? 1);
      return {
        value: i.id,
        label: `${i.menuItemName} x${i.quantity} — ${this.formatKobo(subtotal)}`,
      };
    });

    const stepsHtml = `
      <div id="plan-builder" style="text-align:left;color:#ccc;">
        <p style="font-size:12px;color:#888;margin-bottom:16px;">Add allocations in order. Each person pays, the remainder flows to the next.</p>
        <div id="allocation-rows"></div>
        <button type="button" id="add-row-btn" class="swal2-confirm swal2-styled" style="margin-top:12px;width:100%;background:#22c55e;border:none;color:#1A1A1A;font-weight:600;padding:10px;border-radius:8px;">+ Add Allocation</button>
      </div>
    `;

    Swal.fire({
      title: 'Create Payment Plan',
      html: stepsHtml,
      showCancelButton: true,
      confirmButtonText: 'Create Plan',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#1e293b',
      color: '#fff',
      width: '500px',
      didOpen: () => {
        const container = document.getElementById('allocation-rows');
        const addBtn = document.getElementById('add-row-btn');

        const allocationTypes = [
          { value: 'item', label: 'Specific Items' },
          { value: 'remaining', label: 'Remaining Balance' },
          { value: 'percentage', label: '% of Total' },
          { value: 'amount', label: 'Fixed Amount' },
        ];

        const renderRow = (index: number) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:12px;position:relative;';
          row.innerHTML = `
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-weight:600;color:#22c55e;">${index + 1}.</span>
              <select data-type-select style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                ${allocationTypes.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
              </select>
              <button type="button" data-remove style="padding:6px 10px;border-radius:6px;border:1px solid #ef4444;background:transparent;color:#ef4444;cursor:pointer;">Remove</button>
            </div>
            <div data-fields style="display:none;flex-direction:column;gap:8px;margin-top:8px;"></div>
          `;
          container?.appendChild(row);

          const typeSelect = row.querySelector('select[data-type-select]') as HTMLSelectElement;
          const fieldsDiv = row.querySelector('[data-fields]') as HTMLDivElement;

          const updateFields = () => {
            const type = typeSelect.value;
            let html = '';
            if (type === 'item') {
              html = `
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Items</span>
                  <select multiple data-items style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;min-height:100px;">
                    ${itemOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                  </select>
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Label (e.g., Host)</span>
                  <input type="text" data-label placeholder="Person name" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
              `;
            } else if (type === 'percentage') {
              html = `
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Percentage (0-100)</span>
                  <input type="number" data-percentage min="0" max="100" placeholder="50" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Label</span>
                  <input type="text" data-label placeholder="Person name" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
              `;
            } else if (type === 'amount') {
              html = `
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Amount (kobo)</span>
                  <input type="number" data-amount min="0" placeholder="5000" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Label</span>
                  <input type="text" data-label placeholder="Person name" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
              `;
            } else if (type === 'remaining') {
              html = `
                <label style="display:flex;flex-direction:column;gap:4px;">
                  <span style="font-size:12px;color:#888;">Label (e.g., Rest of group)</span>
                  <input type="text" data-label placeholder="Remaining" style="padding:8px 12px;border-radius:6px;border:1px solid #333;background:#1A1A1A;color:#fff;">
                </label>
              `;
            }
            fieldsDiv.innerHTML = html;
            fieldsDiv.style.display = 'flex';
          };

          typeSelect.addEventListener('change', updateFields);
          updateFields();

          row.querySelector('[data-remove]')?.addEventListener('click', () => row.remove());

          return row;
        };

        renderRow(0);

        addBtn?.addEventListener('click', () => {
          const rows = container?.querySelectorAll('[data-type-select]') || [];
          renderRow(rows.length);
        });
      },
      preConfirm: () => {
        const rows = document.querySelectorAll('#allocation-rows > div');
        const allocations: PaymentPlanAllocation[] = [];

        for (const row of Array.from(rows)) {
          const type = (row.querySelector('[data-type-select]') as HTMLSelectElement)?.value;
          if (!type) continue;

          const alloc: PaymentPlanAllocation = { type: type as AllocationType };

          if (type === 'item') {
            const selected = Array.from((row.querySelector('[data-items]') as HTMLSelectElement)?.selectedOptions || []);
            alloc.order_ids = selected.map(o => o.value);
            alloc.label = (row.querySelector('[data-label]') as HTMLInputElement)?.value || 'Items';
          } else if (type === 'percentage') {
            alloc.percentage = parseFloat((row.querySelector('[data-percentage]') as HTMLInputElement)?.value || '0');
            alloc.label = (row.querySelector('[data-label]') as HTMLInputElement)?.value || 'Percentage';
          } else if (type === 'amount') {
            alloc.amount_kobo = parseInt((row.querySelector('[data-amount]') as HTMLInputElement)?.value || '0');
            alloc.label = (row.querySelector('[data-label]') as HTMLInputElement)?.value || 'Amount';
          } else if (type === 'remaining') {
            alloc.label = (row.querySelector('[data-label]') as HTMLInputElement)?.value || 'Remaining';
          }

          if (alloc.type === 'item' && (!alloc.order_ids || !alloc.order_ids.length)) {
            Swal.showValidationMessage('Please select at least one item for each item allocation.');
            return false;
          }
          if (alloc.type === 'percentage' && (!alloc.percentage || alloc.percentage <= 0)) {
            Swal.showValidationMessage('Percentage must be greater than 0.');
            return false;
          }
          if (alloc.type === 'amount' && (!alloc.amount_kobo || alloc.amount_kobo <= 0)) {
            Swal.showValidationMessage('Amount must be greater than 0.');
            return false;
          }

          allocations.push(alloc);
        }

        if (!allocations.length) {
          Swal.showValidationMessage('Add at least one allocation.');
          return false;
        }

        return { tabId: this.tabId(), allocations };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;

      const { tabId, allocations } = result.value as { tabId: string; allocations: PaymentPlanAllocation[] };
      const dto: CreatePaymentPlanRequest = { allocations };

      this.isProcessing.set(true);
      this.billsApi.createPaymentPlan(tabId, dto).subscribe({
        next: (bills) => {
          this.isProcessing.set(false);
          Swal.fire({
            icon: 'success',
            title: 'Payment Plan Created',
            text: `${bills.length} splits created. Each person pays in order — remainder auto-adjusts.`,
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#f97316',
          });
          this.isSplit.set(true);
          const amounts = bills.map(b => b.totalKobo);
          this.splitAmounts.set(amounts);
          this.splitCount.set(amounts.length);
        },
        error: (err) => {
          this.isProcessing.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to create payment plan',
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#f97316',
          });
        }
      });
    });
  }
}
