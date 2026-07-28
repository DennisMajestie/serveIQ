import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CustomerApiService, PaymentMethod, PaymentInitResponse, PaymentStatusResponse, TabStatusResponse } from '../services/customer-api.service';
import { showApiErrorToast } from '@serveiq/shared/data-access';
import { interval, Subscription, switchMap, finalize } from 'rxjs';

type StatusStep = 'ordering' | 'pending_approval' | 'preparing' | 'ready' | 'payment' | 'paid';

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
  cartService = inject(CartService);

  tabData = signal<TabStatusResponse | null>(null);
  paymentInfo = signal<PaymentInitResponse | null>(null);
  paymentStatus = signal<PaymentStatusResponse | null>(null);
  loading = signal(true);
  error = signal(false);
  polling = signal(false);
  initializingPayment = signal(false);
  errorMessage = signal('');

  private pollSub?: Subscription;

  readonly step = computed((): StatusStep => {
    const tab = this.tabData();
    const payStatus = this.paymentStatus();
    if (!tab) return 'ordering';
    if (payStatus?.paymentStatus === 'paid') return 'paid';
    if (tab.status === 'open' || tab.status === 'billed') {
      const anyDelivered = tab.orders.some(o =>
        o.orderStatus?.toLowerCase() === 'delivered'
      );
      const anyDeclined = tab.orders.some(o =>
        o.orderStatus?.toLowerCase() === 'declined'
      );
      if (tab.orders.length > 0 && (anyDelivered || anyDeclined)) return 'payment';
      const anyReady = tab.orders.some(o =>
        o.orderStatus?.toLowerCase() === 'ready_for_pickup'
      );
      if (anyReady) return 'ready';
      const anyPreparing = tab.orders.some(o =>
        o.orderStatus?.toLowerCase() === 'preparing'
      );
      if (anyPreparing) return 'preparing';
      const anyApproved = tab.orders.some(o =>
        o.orderStatus?.toLowerCase() === 'approved'
      );
      if (anyApproved) return 'preparing';
      return 'pending_approval';
    }
    return 'payment';
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
    } else {
      this.loading.set(false);
      this.error.set(true);
      this.errorMessage.set('No active order found. Please scan the QR code to start.');
    }
  }

  ngOnDestroy() {
    this.stopPolling();
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
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
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
        this.startPaymentPolling(tabId, trackingCode);
      },
      error: (err) => showApiErrorToast(err, 'Failed to initialize payment'),
    });
  }

  private startPaymentPolling(tabId: string, trackingCode: string) {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.api.getPaymentStatus(tabId, trackingCode))
    ).subscribe({
      next: (status) => {
        this.paymentStatus.set(status);
        if (status.paymentStatus === 'paid') {
          this.stopPolling();
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