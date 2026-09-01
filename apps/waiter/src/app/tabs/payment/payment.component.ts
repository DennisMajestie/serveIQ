import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TabsApiService, TablesApiService, PosApiService, OfflineCacheService, BillsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table, AllocationType, PaymentPlanAllocation } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';
import { map, interval, Subscription, switchMap, firstValueFrom } from 'rxjs';

type GuestMode = 'items' | AllocationType.AMOUNT | AllocationType.PERCENTAGE | AllocationType.REMAINING;

interface GuestCard {
  id: string;
  label: string;
  mode: GuestMode;
  orderIds: string[];
  percentage: number;
  amountInput: string;
  amountKobo: number;
  billId?: string;
  paid: boolean;
}

interface AllocatableItem {
  id: string;
  name: string;
  qty: number;
  subtotalKobo: number;
  orderStatus: string;
}

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

  // ── Split / Guest cards ──
  isSplit = signal(false);
  guests = signal<GuestCard[]>([]);
  splitLocked = computed(() => this.guests().some(g => g.paid));

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
        if (tab?.tableId) {
          this.offlineData.getTable(tab.tableId).subscribe({
            next: (table) => { if (table) this.table.set(table); }
          });
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
          if (this.isSplit() && this.guests().length === 0) this.seedEqualSplit();
        }
        this.isLoading.set(false);
        this.startPaymentPolling(tabId);
        this.bootstrapFromSplits(tabId);
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
            if (this.isSplit() && this.guests().length === 0) this.seedEqualSplit();
          }
          this.isLoading.set(false);
          this.startPaymentPolling(tabId);
        });
      },
    });
  }

  /**
   * If the tab already has a split plan (e.g. the waiter reopened this page, or
   * the plan was created on another device), restore the guest cards from the
   * live splits so per-guest collection continues instead of silently settling
   * the whole tab (which would double-count the paid split rows).
   */
  private bootstrapFromSplits(tabId: string) {
    this.billsApi.getSplits(tabId).subscribe({
      next: (bills) => {
        const splits = (bills || [])
          .filter((b: any) => b.splitGroup && !b.voidedAt)
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        if (splits.length === 0) return;

        const modeMap: Record<string, GuestMode> = {
          item: 'items',
          items: 'items',
          amount: AllocationType.AMOUNT,
          percentage: AllocationType.PERCENTAGE,
          remaining: AllocationType.REMAINING,
        };

        this.isSplit.set(true);
        this.guests.set(splits.map((b: any, i: number) => ({
          id: b.id,
          label: b.allocationConfig?.label ?? `Guest ${i + 1}`,
          mode: modeMap[b.allocationType] ?? AllocationType.AMOUNT,
          orderIds: b.allocationConfig?.order_ids ?? [],
          percentage: b.allocationConfig?.percentage ?? 0,
          amountInput: (b.totalKobo / 100).toFixed(2),
          amountKobo: b.totalKobo,
          billId: b.id,
          paid: !!b.paidAt,
        })));
      },
      error: () => {},
    });
  }

  private startPaymentPolling(tabId: string) {
    this.stopPaymentPolling();
    this.pollSubscription = interval(5000).pipe(
      switchMap(() => this.isSplit() ? this.billsApi.getSplits(tabId) : this.offlineData.getBill(tabId)),
    ).subscribe({
      next: (data: any) => {
        if (this.isSplit()) {
          const splits: Bill[] = (Array.isArray(data) ? data : [])
            .filter((b: any) => b.splitGroup);
          this.syncSplitState(splits);
          if (!this.allGuestsPaid()) return;
          this.isSuccess.set(true);
          this.isAutoConfirmed.set(true);
          this.stopPaymentPolling();
          setTimeout(() => this.navigateSuccess(), 1000);
          return;
        }
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

  // ── Split / Guest card logic ──

  toggleSplit() {
    // Never allow turning split off once a share has been collected — a full
    // settle afterwards would double-count the already-paid split rows.
    if (this.isSplit() && this.splitLocked()) return;
    const next = !this.isSplit();
    this.isSplit.set(next);
    if (next && this.guests().length === 0) {
      this.seedEqualSplit();
    }
  }

  private newGuest(label: string): GuestCard {
    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      label,
      mode: AllocationType.AMOUNT,
      orderIds: [],
      percentage: 0,
      amountInput: '',
      amountKobo: 0,
      paid: false,
    };
  }

  private seedEqualSplit() {
    const total = this.bill()?.totalKobo ?? 0;
    const each = Math.floor(total / 2);
    const cards: GuestCard[] = [];
    for (let i = 0; i < 2; i++) {
      const amount = each + (i === 1 ? total - each * 2 : 0);
      cards.push({
        ...this.newGuest(`Guest ${i + 1}`),
        amountKobo: amount,
        amountInput: (amount / 100).toFixed(2),
      });
    }
    this.guests.set(cards);
  }

  addGuestCard() {
    if (this.splitLocked()) return;
    this.guests.update(gs => [...gs, this.newGuest(`Guest ${gs.length + 1}`)]);
  }

  removeGuest(index: number) {
    if (this.splitLocked()) return;
    this.guests.update(gs => gs.filter((_, i) => i !== index));
    if (this.guests().length === 0) {
      this.isSplit.set(false);
    }
  }

  updateGuestLabel(g: GuestCard, label: string) {
    this.guests.update(gs => gs.map(x => x.id === g.id ? { ...x, label: label || x.label } : x));
  }

  setGuestMode(g: GuestCard, mode: GuestMode) {
    if (mode === AllocationType.REMAINING && this.guests().some(x => x.id !== g.id && x.mode === AllocationType.REMAINING)) {
      Swal.fire({ icon: 'warning', title: 'One Remainder Only', text: 'Only one guest can take the remaining balance.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    this.guests.update(gs => gs.map(x => x.id === g.id ? {
      ...x,
      mode,
      orderIds: mode === 'items' ? x.orderIds : [],
      percentage: mode === AllocationType.PERCENTAGE ? (x.percentage || 50) : x.percentage,
      amountInput: mode === AllocationType.AMOUNT ? x.amountInput : x.amountInput,
    } : x));
  }

  setGuestAmount(g: GuestCard, value: string) {
    this.guests.update(gs => gs.map(x => x.id === g.id ? { ...x, amountInput: value } : x));
  }

  setGuestPercentage(g: GuestCard, value: number) {
    this.guests.update(gs => gs.map(x => x.id === g.id ? { ...x, percentage: Math.max(0, Math.min(100, value || 0)) } : x));
  }

  itemOptions = computed<AllocatableItem[]>(() => {
    return (this.bill()?.orderItems ?? []).map(i => {
      const raw = i as any;
      const status = (raw.orderStatus ?? raw.order_status ?? '').toString().toLowerCase();
      return {
        id: i.id,
        name: i.menuItemName ?? raw.menu_item_name ?? 'Item',
        qty: i.quantity ?? raw.qty ?? 1,
        subtotalKobo: this.itemSubtotal(raw),
        orderStatus: status,
      };
    }).filter(it => it.subtotalKobo > 0 && it.orderStatus !== 'declined' && it.orderStatus !== 'cancelled');
  });

  itemSubtotal(raw: any): number {
    return Math.round((raw.priceKobo ?? raw.price_kobo ?? 0) * (raw.quantity ?? raw.qty ?? 1));
  }

  availableItems(g: GuestCard): AllocatableItem[] {
    const taken = new Set(
      this.guests()
        .filter(x => x.id !== g.id)
        .flatMap(x => x.orderIds)
    );
    return this.itemOptions().filter(it => !taken.has(it.id));
  }

  toggleGuestItem(g: GuestCard, itemId: string) {
    if (this.splitLocked()) return;
    this.guests.update(gs => gs.map(x => x.id === g.id ? {
      ...x,
      orderIds: x.orderIds.includes(itemId)
        ? x.orderIds.filter(id => id !== itemId)
        : [...x.orderIds, itemId],
    } : x));
  }

  guestAllocated(g: GuestCard): number {
    const total = this.bill()?.totalKobo ?? 0;
    if (g.billId || g.paid) return g.amountKobo;

    switch (g.mode) {
      case 'items': {
        const ids = new Set(g.orderIds);
        return this.itemOptions().filter(it => ids.has(it.id))
          .reduce((sum, it) => sum + it.subtotalKobo, 0);
      }
      case AllocationType.PERCENTAGE:
        return Math.round((total * (g.percentage || 0)) / 100);
      case AllocationType.AMOUNT:
        return Math.round((parseFloat(g.amountInput || '0') || 0) * 100);
      case AllocationType.REMAINING: {
        const otherSum = this.guests()
          .filter(x => x.id !== g.id && x.mode !== AllocationType.REMAINING)
          .reduce((sum, x) => sum + this.guestAllocated(x), 0);
        return Math.max(0, total - otherSum);
      }
      default:
        return 0;
    }
  }

  get allocatedKobo(): number {
    return this.guests().reduce((sum, g) => sum + this.guestAllocated(g), 0);
  }

  get remainingKobo(): number {
    const total = this.bill()?.totalKobo ?? 0;
    return Math.max(0, total - this.allocatedKobo);
  }

  get isSplitValid(): boolean {
    const total = this.bill()?.totalKobo ?? 0;
    if (this.guests().length === 0) return false;
    return Math.abs(this.allocatedKobo - total) < 1;
  }

  private buildAllocation(g: GuestCard): PaymentPlanAllocation {
    const base: Partial<PaymentPlanAllocation> = { label: g.label };
    switch (g.mode) {
      case 'items':
        return { ...base, type: AllocationType.ITEM, order_ids: g.orderIds } as PaymentPlanAllocation;
      case AllocationType.PERCENTAGE:
        return { ...base, type: AllocationType.PERCENTAGE, percentage: g.percentage } as PaymentPlanAllocation;
      case AllocationType.AMOUNT:
        return { ...base, type: AllocationType.AMOUNT, amount_kobo: Math.round((parseFloat(g.amountInput || '0') || 0) * 100) } as PaymentPlanAllocation;
      case AllocationType.REMAINING:
        return { ...base, type: AllocationType.REMAINING } as PaymentPlanAllocation;
      default:
        return { ...base, type: AllocationType.AMOUNT, amount_kobo: 0 } as PaymentPlanAllocation;
    }
  }

  private buildEffectiveGuests(): { guest: GuestCard; amountKobo: number }[] {
    return this.guests()
      .map(g => ({ guest: g, amountKobo: this.guestAllocated(g) }))
      .filter(e => e.amountKobo > 0);
  }

  private async createSplitPlan(): Promise<void> {
    const effective = this.buildEffectiveGuests();
    if (effective.length === 0) {
      throw new Error('No guest has an amount to allocate.');
    }
    const bills = await firstValueFrom(this.billsApi.createPaymentPlan(this.tabId(), {
      allocations: effective.map(e => this.buildAllocation(e.guest)),
    }));
    const sorted = [...(bills || [])].sort((a, b) =>
      (a.sequence ?? +new Date(a.createdAt).getTime()) - (b.sequence ?? +new Date(b.createdAt).getTime())
    );
    this.guests.update(gs => gs.map(g => {
      const idx = effective.findIndex(e => e.guest.id === g.id);
      const b = idx >= 0 ? sorted[idx] : undefined;
      return b ? { ...g, billId: b.id, amountKobo: b.totalKobo ?? g.amountKobo, paid: !!b.paidAt } : g;
    }));
  }

  private syncSplitState(splits: Bill[]) {
    const byId = new Map(splits.map(b => [b.id, b]));
    this.guests.update(gs => gs.map(g => {
      const b = g.billId ? byId.get(g.billId) : undefined;
      return b ? { ...g, amountKobo: b.totalKobo ?? g.amountKobo, paid: !!b.paidAt } : g;
    }));
  }

  private async refreshSplits(): Promise<void> {
    if (!this.isSplit()) return;
    const bills = await firstValueFrom(this.billsApi.getSplits(this.tabId()));
    this.syncSplitState((bills || []).filter((b: any) => b.splitGroup));
  }

  allGuestsPaid(): boolean {
    return this.guests().length > 0 && this.guests().every(g => g.paid);
  }

  private navigateSuccess() {
    const allocations = this.guests().map((g, i) => ({ guest: i + 1, amountKobo: g.amountKobo }));
    this.router.navigate(['/tabs/payment-success', this.tabId()], {
      state: {
        terminalLabel: this.selectedTerminalLabel(),
        showConfetti: true,
        splitAllocations: allocations,
      }
    });
  }

  async chargeGuest(target: GuestCard) {
    if (this.isProcessing()) return;
    const fresh = this.guests().find(x => x.id === target.id);
    if (!fresh || fresh.paid) return;

    if (!this.isSplitValid) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Allocation', text: 'Allocate the full bill amount across guests before charging.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    if (this.selectedMethod !== 'cash' && !this.selectedTerminalId()) {
      Swal.fire({ icon: 'warning', title: 'Terminal Required', text: 'Please select a POS terminal to process this payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }

    this.isProcessing.set(true);
    try {
      if (!fresh.billId) {
        await this.createSplitPlan();
      }
      const current = this.guests().find(x => x.id === target.id);
      if (!current?.billId) throw new Error('Could not prepare the split plan.');
      const amountKobo = this.guestAllocated(current);
      if (amountKobo <= 0) throw new Error('This guest has no amount to collect.');

      const apiMethod = this.selectedMethod === 'ussd' ? 'transfer' : this.selectedMethod;
      const payment = {
        bill_id: current.billId,
        amount: amountKobo,
        method: apiMethod as 'cash' | 'card' | 'transfer' | 'ussd' | 'pos',
        terminal_id: this.selectedMethod !== 'cash' ? this.selectedTerminalId() : undefined,
        idempotency_key: `split-${current.billId}`,
      };

      const res = await this.offlineData.recordPayment(this.tabId(), payment);
      const isOffline = !!(res as any)?.offline;

      if (isOffline) {
        // Optimistically mark this share settled; polling will reconcile.
        this.guests.update(gs => gs.map(x => x.id === current.id ? { ...x, paid: true } : x));
      } else {
        await this.refreshSplits();
      }

      if (this.allGuestsPaid()) {
        this.isSuccess.set(true);
        this.isAutoConfirmed.set(true);
        this.stopPaymentPolling();
        setTimeout(() => this.navigateSuccess(), 1000);
      }
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Could not process the payment. Please try again.';
      Swal.fire({ icon: 'error', title: 'Payment Failed', text: msg, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
    } finally {
      this.isProcessing.set(false);
    }
  }

  async chargeAllGuests() {
    if (this.isProcessing()) return;
    const unpaidIds = this.guests().filter(g => !g.paid).map(g => g.id);
    for (const id of unpaidIds) {
      if (this.allGuestsPaid()) break;
      const g = this.guests().find(x => x.id === id);
      if (!g || g.paid) continue;
      await this.chargeGuest(g);
    }
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