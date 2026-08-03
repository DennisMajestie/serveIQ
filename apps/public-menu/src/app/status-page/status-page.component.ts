import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CustomerApiService, PaymentMethod, PaymentInitResponse, PaymentStatusResponse, TabStatusResponse } from '../services/customer-api.service';
import { PublicAdsApiService, Ad, showApiErrorToast } from '@serveiq/shared/data-access';
import { interval, Subscription, switchMap, finalize } from 'rxjs';

type StatusStep = 'ordering' | 'pending_approval' | 'preparing' | 'ready' | 'payment' | 'paid';

interface Stage {
  key: string;
  label: string;
  icon: string;
  done: boolean;
}

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-page.component.html',
  styleUrls: ['./status-page.component.scss'],
})
export class StatusPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(CustomerApiService);
  private adsApi = inject(PublicAdsApiService);
  cartService = inject(CartService);

  tabData = signal<TabStatusResponse | null>(null);
  paymentInfo = signal<PaymentInitResponse | null>(null);
  paymentStatus = signal<PaymentStatusResponse | null>(null);
  selectedTerminalId = signal<string | null>(null);
  loading = signal(true);
  error = signal(false);
  polling = signal(false);
  initializingPayment = signal(false);
  errorMessage = signal('');

  ads = signal<Ad[]>([]);
  currentAdIndex = signal(0);
  adRotateInterval: ReturnType<typeof setInterval> | null = null;

  private pollSub?: Subscription;
  private paymentSub?: Subscription;

  readonly currentAd = computed(() => {
    const list = this.ads();
    return list.length > 0 ? list[this.currentAdIndex() % list.length] : null;
  });

  readonly stages = computed((): Stage[] => {
    const tab = this.tabData();
    if (!tab) return [];
    const o = tab.orders;
    const any = (pred: (s: string) => boolean) => o.some(x => pred((x.orderStatus || '').toLowerCase()));
    const inProgress = (s: string) => ['approved', 'assigned_to_department', 'preparing', 'ready_for_pickup', 'delivered'].includes(s);
    const preparing = any(inProgress);
    const ready = any(s => ['ready_for_pickup', 'delivered'].includes(s));
    const delivered = any(s => s === 'delivered');
    return [
      { key: 'received', label: 'Received', icon: 'receipt', done: o.length > 0 },
      { key: 'approved', label: 'Approved', icon: 'thumb_up', done: any(inProgress) },
      { key: 'preparing', label: 'Preparing', icon: 'cooking', done: preparing },
      { key: 'ready', label: 'Ready', icon: 'route', done: ready },
      { key: 'delivered', label: 'Delivered', icon: 'check_circle', done: delivered },
    ];
  });

  readonly currentStageKey = computed(() => {
    const s = this.stages();
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i].done) return s[i].key;
    }
    return s[0]?.key ?? 'received';
  });

  readonly step = computed((): StatusStep => {
    const tab = this.tabData();
    const payStatus = this.paymentStatus();
    if (!tab) return 'ordering';
    const status = (s: any) => (s || '').toLowerCase();
    const o = tab.orders;
    const any = (pred: (s: string) => boolean) => o.some(x => pred(status(x.orderStatus)));

    // Prepaid takeaway is only "paid" once the food has actually been collected
    // (all orders terminal). Before that, keep showing Prep/Ready so the customer
    // watches progress even though money already went through.
    const allCollected =
      o.length > 0 && o.every(x => ['delivered', 'completed'].includes(status(x.orderStatus)));
    const moneyTaken = payStatus?.paymentStatus === 'paid' || tab.status === 'paid';
    if (moneyTaken && allCollected) return 'paid';

    if (any(s => s === 'pending_payment_approval')) return 'payment';

    const anyDelivered = any(s => s === 'delivered');
    const anyDeclined = any(s => s === 'declined');
    if (o.length > 0 && (anyDelivered || anyDeclined)) return 'payment';
    if (any(s => s === 'ready_for_pickup')) return 'ready';
    if (any(s => ['preparing', 'assigned_to_department', 'approved'].includes(s))) return 'preparing';
    return 'pending_approval';
  });

  readonly progressWidth = computed(() => {
    const steps: StatusStep[] = ['pending_approval', 'preparing', 'ready', 'payment', 'paid'];
    const idx = steps.indexOf(this.step());
    return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 10;
  });

  ngOnInit() {
    const codeParam = this.route.snapshot.paramMap.get('code');
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();

    if (codeParam) {
      this.api.getTrackingByCode(codeParam).subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data.tabId) {
            this.cartService.setSession(data.tabId, codeParam, data.branchId);
            this.startPolling(data.tabId, codeParam);
          }
          this.setTabFromTracking(data);
          if (data.branchId) this.loadAds(data.branchId);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
          this.errorMessage.set('Tracking code not found');
        },
      });
    } else if (tabId && trackingCode) {
      this.loading.set(false);
      this.startPolling(tabId, trackingCode);
      const branchId = this.cartService.branchId();
      if (branchId) this.loadAds(branchId);
    } else {
      this.loading.set(false);
      this.error.set(true);
      this.errorMessage.set('No active order found. Please scan the QR code to start.');
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    if (this.adRotateInterval) {
      clearInterval(this.adRotateInterval);
      this.adRotateInterval = null;
    }
  }

  private loadAds(branchId: string) {
    this.adsApi.getAds(branchId).subscribe({
      next: (ads) => {
        this.ads.set(ads);
        if (ads.length > 1 && !this.adRotateInterval) {
          this.adRotateInterval = setInterval(() => {
            this.currentAdIndex.update(i => i + 1);
          }, 5000);
        }
      },
      error: () => this.ads.set([]),
    });
  }

  private startPolling(tabId: string, trackingCode: string) {
    this.polling.set(true);
    this.pollSub = interval(8000).pipe(
      switchMap(() => this.api.getTabStatus(tabId, trackingCode))
    ).subscribe({
      next: (data) => this.tabData.set(data),
      error: (err) => {
        const msg = err?.serverMessage || err?.message || '';
        if (msg.toLowerCase().includes('not found') || err?.statusCode === 404) {
          this.stopPolling();
          this.error.set(true);
          this.errorMessage.set('This order is no longer active. It may have been completed or cancelled.');
        }
      },
    });
    this.api.getTabStatus(tabId, trackingCode).subscribe({
      next: (data) => this.tabData.set(data),
    });
    this.pollPaymentStatus(tabId, trackingCode);
  }

  private pollPaymentStatus(tabId: string, trackingCode: string) {
    this.paymentSub?.unsubscribe();
    this.paymentSub = interval(8000).pipe(
      switchMap(() => this.api.getPaymentStatus(tabId, trackingCode))
    ).subscribe({
      next: (status) => {
        this.paymentStatus.set(status);
        if (status.paymentStatus === 'paid') {
          this.paymentSub?.unsubscribe();
        }
      },
      error: () => {},
    });
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
    this.paymentSub?.unsubscribe();
    this.polling.set(false);
  }

  private setTabFromTracking(data: any) {
    const mapped: TabStatusResponse = {
      id: data.tabId,
      tableId: '',
      status: data.tabStatus,
      customerName: '',
      partySize: 1,
      tabType: '',
      trackingCode: '',
      trackingGeneratedAt: data.trackingGeneratedAt,
      openedAt: '',
      totalKobo: data.orders?.reduce?.((s: number, o: any) => s + (o.subtotalKobo || 0), 0) || 0,
      orders: (data.orders || []).map((o: any) => ({
        id: o.id,
        menuItemId: o.menuItemId || '',
        quantity: o.quantity,
        subtotalKobo: o.subtotalKobo || 0,
        orderStatus: (o.orderStatus || '').toLowerCase(),
        createdAt: o.createdAt,
      })),
    };
    this.tabData.set(mapped);
  }

  payNow() {
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();
    if (!tabId || !trackingCode) return;

    this.initializingPayment.set(true);
    this.api.initializePayment(tabId, trackingCode).pipe(finalize(() => this.initializingPayment.set(false))).subscribe({
      next: (res) => {
        this.paymentInfo.set(res);
        this.selectedTerminalId.set(null);
        this.startPaymentPolling(tabId, trackingCode);
      },
      error: (err) => showApiErrorToast(err, 'Failed to initialize payment'),
    });
  }

  selectTerminal(id: string) {
    this.selectedTerminalId.set(this.selectedTerminalId() === id ? null : id);
  }

  copiedAccount = signal<string | null>(null);

  copyAccount(accountNumber: string) {
    navigator.clipboard.writeText(accountNumber).then(() => {
      this.copiedAccount.set(accountNumber);
      setTimeout(() => this.copiedAccount.set(null), 2000);
    });
  }

  readonly selectedTerminal = computed<PaymentMethod | null>(() => {
    const id = this.selectedTerminalId();
    if (!id) return null;
    return this.paymentInfo()?.paymentMethods.find(m => m.id === id) ?? null;
  });

  selectedTerminalLabel(): string {
    const id = this.selectedTerminalId();
    if (!id) return '';
    if (id === 'cash') return 'Cash';
    return this.selectedTerminal()?.label || 'POS terminal';
  }

  private startPaymentPolling(tabId: string, trackingCode: string) {
    this.paymentSub?.unsubscribe();
    this.paymentSub = interval(5000).pipe(
      switchMap(() => this.api.getPaymentStatus(tabId, trackingCode))
    ).subscribe({
      next: (status) => {
        this.paymentStatus.set(status);
        if (status.paymentStatus === 'paid') {
          this.paymentSub?.unsubscribe();
        }
      },
      error: () => {},
    });
  }

  isDeclined(status: string): boolean {
    return status?.toLowerCase().includes('declined');
  }

  statusClass(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s.includes('pending')) return 'status-pending';
    if (s === 'approved') return 'status-approved';
    if (s === 'preparing') return 'status-preparing';
    if (s === 'ready_for_pickup') return 'status-ready';
    if (s === 'delivered') return 'status-delivered';
    if (s.includes('declined')) return 'status-declined';
    return '';
  }

  formatStatus(status: string): string {
    const s = status?.toLowerCase() || '';
    const labels: Record<string, string> = {
      pending_supervisor_approval: 'Pending',
      pending_payment_approval: 'Awaiting Payment',
      approved: 'Approved',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready',
      delivered: 'Delivered',
      declined: 'Declined',
    };
    return labels[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get orderStatusLabel(): string {
    const s = this.step();
    const labels: Record<string, string> = {
      ordering: 'Ordering',
      pending_approval: 'Pending Approval',
      preparing: 'Being Prepared',
      ready: 'Ready for Pickup',
      payment: 'Awaiting Payment',
      paid: 'Paid',
    };
    return labels[s] || s;
  }

  get orderTypeLabel(): string {
    return this.tabData()?.tabType === 'takeaway' ? 'Takeaway' : 'Dine In';
  }

  get orderStatusIcon(): string {
    const s = this.step();
    const icons: Record<string, string> = {
      ordering: '📋',
      pending_approval: '⏳',
      preparing: '👨‍🍳',
      ready: '✅',
      payment: '💳',
      paid: '🎉',
    };
    return icons[s] || '📋';
  }
}