import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CustomerApiService, PaymentMethod, PaymentInitResponse, PaymentStatusResponse, TabStatusResponse } from '../services/customer-api.service';
import { CallWaiterComponent } from '../call-waiter/call-waiter.component';
import {
  PublicAdsApiService,
  Ad,
  showApiErrorToast,
  ENVIRONMENT_CONFIG,
} from '@serveiq/shared/data-access';
import { io, Socket } from 'socket.io-client';
import { interval, Subscription, switchMap, finalize } from 'rxjs';

type StatusStep = 'ordering' | 'pending_approval' | 'preparing' | 'ready' | 'on_the_way' | 'payment' | 'paid';

interface Stage {
  key: string;
  label: string;
  icon: string;
  done: boolean;
}

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CallWaiterComponent],
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

  // ── Cash-at-counter flow ───────────────────────────────────────────────────
  // Customer taps cash → a confirmation modal opens; once confirmed the request
  // is held pending supervisor confirmation at the counter. `cashPending` drives
  // the "Waiting to confirm pay" loader until the supervisor confirms (payment
  // status flips to 'paid' via polling/socket). `showCashModal` gates the tap
  // so a customer can't spam the supervisor before confirming.
  cashSubmitting = signal(false);
  cashPending = signal(false);
  showCashModal = signal(false);

  // ── Review modal (shown after payment success) ─────────────────────────────
  showReviewModal = signal(false);
  reviewRating = signal(0);
  reviewComment = signal('');
  reviewSubmitting = signal(false);
  reviewSubmitted = signal(false);
  private celebratedPayment = false;

  ads = signal<Ad[]>([]);
  currentAdIndex = signal(0);
  adRotateInterval: ReturnType<typeof setInterval> | null = null;

  private pollSub?: Subscription;
  private paymentSub?: Subscription;
  private env = inject(ENVIRONMENT_CONFIG);
  private paymentSocket?: Socket;

  // ── Pickup alert (client-side only) ───────────────────────────────────────
  readonly pickupConfirmed = signal(false);
  readonly pickupReady = computed(() => this.step() === 'ready' && !this.pickupConfirmed());

  /** True once any order has been delivered (dine-in meal served / takeaway boxed).
   *  Replaces the progress stepper with the served celebration. */
  readonly isServed = computed(() => {
    const tab = this.tabData();
    if (!tab || tab.orders.length === 0) return false;
    return tab.orders.some(x => (x.orderStatus || '').toLowerCase() === 'delivered');
  });

  private servedCelebrated = false;
  private servedWatcher = effect(() => {
    if (this.isServed() && !this.servedCelebrated) {
      this.servedCelebrated = true;
      this.playSuccessChime();
      this.launchConfetti();
    }
  });

  private pickupTimer?: ReturnType<typeof setInterval>;
  private audioCtx?: AudioContext | null;
  private canvas?: HTMLCanvasElement | null;
  private anim?: number;

  private pickupWatcherEffect = effect(() => {
    if (this.pickupReady()) {
      this.startPickupAlarm();
    } else if (!this.pickupConfirmed()) {
      this.stopPickupAlarm();
    }
  });

  private startPickupAlarm() {
    this.stopPickupAlarm();
    // Beep every ~1.5s while waiting, plus vibration pulse on mobile.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(300);
    }
    this.playPickupBeep();
    this.pickupTimer = setInterval(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([80, 60, 80]);
      }
      this.playPickupBeep();
    }, 1500);
  }

  private stopPickupAlarm() {
    if (this.pickupTimer) {
      clearInterval(this.pickupTimer);
      this.pickupTimer = undefined;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(0);
    }
  }

  private audio(): AudioContext | null {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') void this.audioCtx.resume();
      return this.audioCtx;
    }
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      this.audioCtx = new Ctor();
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playPickupBeep() {
    const ctx = this.audio();
    if (!ctx) return;
    [0, 0.22].forEach((offset) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime + offset;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.start(t0);
      o.stop(t0 + 0.16);
    });
  }

  private playSuccessChime() {
    const ctx = this.audio();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.16;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.start(t0);
      o.stop(t0 + 0.45);
    });
  }

  goBackToMenu() {
    const branchId = this.cartService.branchId();
    const target = branchId ? `/public/menu/${branchId}` : '/public/menu/default';
    this.router.navigateByUrl(target);
  }

  confirmPickup() {
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();
    if (!tabId || !trackingCode) return;

    this.api.confirmReceived(tabId, trackingCode).subscribe({
      next: (updated) => {
        this.pickupConfirmed.set(true);
        this.stopPickupAlarm();
        this.playSuccessChime();
        this.launchConfetti();
        if (updated) this.tabData.set(updated);
      },
      error: (err) => {
        const msg =
          err?.serverMessage ||
          err?.error?.message ||
          err?.message ||
          'Could not confirm receipt';
        showApiErrorToast(err, 'Confirm received failed');
        if (msg.toLowerCase().includes('not open')) {
          this.error.set(true);
          this.errorMessage.set(msg);
        }
      },
    });
  }

  private launchConfetti() {
    const host = document.querySelector('.status-page') as HTMLElement | null;
    if (!host) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    this.canvas.width = w;
    this.canvas.height = h;
    document.body.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx || !this.canvas) { this.canvas?.remove(); return; }

    const colors = ['#4be277', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#fbbf24'];
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * this.canvas!.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < 5500) {
        this.anim = requestAnimationFrame(tick);
      } else {
        this.canvas?.remove();
        this.canvas = null;
      }
    };
    this.anim = requestAnimationFrame(tick);
  }

  private onPaymentPaid() {
    if (this.celebratedPayment) return;
    this.celebratedPayment = true;
    this.cashPending.set(false);
    // Reflect the paid state so the progress step computes 'paid' immediately.
    this.paymentStatus.set({
      ...(this.paymentStatus() as PaymentStatusResponse),
      paymentStatus: 'paid',
    } as PaymentStatusResponse);
    this.playSuccessChime();
    this.launchConfetti();
    this.showReviewModal.set(true);
  }

  /** Cash-at-counter: register the customer's intent to pay with cash. The order
   *  is held pending supervisor confirmation; the existing payment poll flips the
   *  status to 'paid' once the supervisor confirms at the counter. */
  confirmCash() {
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();
    // Guard against duplicate submissions while a request is already in flight
    // or already pending supervisor confirmation.
    if (!tabId || !trackingCode || this.cashPending() || this.cashSubmitting()) return;

    this.cashSubmitting.set(true);
    this.api.submitCashIntent(tabId, trackingCode).pipe(
      finalize(() => this.cashSubmitting.set(false)),
    ).subscribe({
      next: () => {
      this.cashPending.set(true);
      this.connectPaymentSocket(tabId, trackingCode);
      },
      error: (err) => {
        showApiErrorToast(err, 'Cash payment request failed');
      },
    });
  }

  setRating(rating: number) {
    this.reviewRating.set(rating);
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
    this.reviewSubmitted.set(false);
  }

  submitReview() {
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();
    const rating = this.reviewRating();
    if (!tabId || !trackingCode || rating < 1) return;

    this.reviewSubmitting.set(true);
    this.api.submitReview(tabId, trackingCode, { rating, comment: this.reviewComment() }).subscribe({
      next: () => {
        this.reviewSubmitting.set(false);
        this.reviewSubmitted.set(true);
      },
      error: (err) => {
        this.reviewSubmitting.set(false);
        showApiErrorToast(err, 'Failed to submit review');
      },
    });
  }

  readonly currentAd = computed(() => {
    const list = this.ads();
    return list.length > 0 ? list[this.currentAdIndex() % list.length] : null;
  });

  readonly stages = computed((): Stage[] => {
    const tab = this.tabData();
    if (!tab) return [];
    const o = tab.orders;
    const isTakeaway = tab.tabType === 'takeaway';
    const any = (pred: (s: string) => boolean) => o.some(x => pred((x.orderStatus || '').toLowerCase()));
    const inProgress = (s: string) => ['approved', 'assigned_to_department', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].includes(s);
    const preparing = any(inProgress);
    const ready = any(s => ['ready_for_pickup', 'out_for_delivery', 'delivered'].includes(s));
    const onTheWay = any(s => ['out_for_delivery', 'delivered'].includes(s));
    const delivered = any(s => s === 'delivered');
    return [
      { key: 'received', label: 'Received', icon: 'receipt_long', done: o.length > 0 },
      { key: 'approved', label: 'Approved', icon: 'thumb_up', done: any(inProgress) },
      { key: 'preparing', label: 'Preparing', icon: 'cooking', done: preparing },
      { key: 'ready', label: 'Ready', icon: 'route', done: ready },
      // Dine-in adds an "On Its Way" leg before the served meal; takeaway ends on the boxed order.
      ...(isTakeaway
        ? [{ key: 'delivered', label: 'Boxed', icon: 'takeout_dining', done: delivered }]
        : [
            { key: 'on_the_way', label: 'On Its Way', icon: 'delivery_dining', done: onTheWay },
            { key: 'delivered', label: 'Delivered', icon: 'restaurant', done: delivered },
          ]),
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
    if (any(s => s === 'out_for_delivery')) return 'on_the_way';
    if (any(s => s === 'ready_for_pickup')) return 'ready';
    if (any(s => ['preparing', 'assigned_to_department', 'approved'].includes(s))) return 'preparing';
    return 'pending_approval';
  });

  readonly progressWidth = computed(() => {
    const steps: StatusStep[] = ['pending_approval', 'preparing', 'ready', 'on_the_way', 'payment', 'paid'];
    const idx = steps.indexOf(this.step());
    return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 10;
  });

  ngOnInit() {
    const codeParam = this.route.snapshot.paramMap.get('code');
    const tabId = this.cartService.tabId();
    const trackingCode = this.cartService.trackingCode();

    if (codeParam) {
      const branchId =
        this.route.snapshot.queryParamMap.get('branch_id') ??
        this.cartService.branchId() ??
        undefined;
      this.api.getTrackingByCode(codeParam, branchId).subscribe({
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
    this.pickupWatcherEffect.destroy();
    this.servedWatcher.destroy();
    this.stopPickupAlarm();
    if (this.anim !== undefined) cancelAnimationFrame(this.anim);
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') void this.audioCtx.close();
    this.audioCtx = null;
    if (this.adRotateInterval) {
      clearInterval(this.adRotateInterval);
      this.adRotateInterval = null;
    }
    this.disconnectPaymentSocket();
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
    this.connectPaymentSocket(tabId, trackingCode);
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
    this.paymentSub?.unsubscribe();
    this.polling.set(false);
  }

  private setTabFromTracking(data: any) {
    const subtotalKobo =
      data.orders?.reduce?.((s: number, o: any) => s + (o.subtotalKobo || 0), 0) || 0;
    const mapped: TabStatusResponse = {
      id: data.tabId,
      tableId: '',
      status: data.tabStatus,
      customerName: '',
      partySize: 1,
      tabType: data.tabType || '',
      trackingCode: '',
      trackingGeneratedAt: data.trackingGeneratedAt,
      openedAt: '',
      totalKobo: Number(data.totalKobo ?? subtotalKobo),
      subtotalKobo: Number(data.subtotalKobo ?? subtotalKobo),
      serviceChargeKobo: Number(data.serviceChargeKobo ?? 0),
      taxKobo: Number(data.taxKobo ?? 0),
      orders: (data.orders || []).map((o: any) => ({
        id: o.id,
        menuItemId: o.menuItemId || '',
        menuItemName: o.menuItemName || null,
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
        this.connectPaymentSocket(tabId, trackingCode);
      },
      error: (err) => {
        const body = err?.error ?? err;
        const msg =
          (body && typeof body.message === 'string' && body.message) ||
          (body && typeof body.serverMessage === 'string' && body.serverMessage) ||
          '';
        showApiErrorToast(err, 'Failed to initialize payment');
      },
    });
  }

  selectTerminal(id: string) {
    this.selectedTerminalId.set(this.selectedTerminalId() === id ? null : id);
    if (id === 'cash' && this.selectedTerminalId() === 'cash') {
      // Tapping cash opens a confirmation modal instead of submitting straight
      // away, so a customer can't accidentally spam the supervisor. Submission
      // only happens once the customer confirms.
      this.showCashModal.set(true);
    }
  }

  confirmRequestCash() {
    this.showCashModal.set(false);
    this.confirmCash();
  }

  cancelRequestCash() {
    this.showCashModal.set(false);
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

  /** Connect to the public realtime channel and wait for a `paymentConfirmed`
   *  push for this tab. This replaces the previous 5s REST polling — the status
   *  page is now poll-free for payment confirmation. Safe to call more than once;
   *  only one socket is ever opened. */
  private connectPaymentSocket(tabId: string, trackingCode: string) {
    if (this.paymentSocket) return;
    // In production `apiUrl` is empty (REST is proxied via Vercel's /api/v1
    // rewrite), so the socket must target the real backend origin directly —
    // Vercel does not proxy /socket.io. Fall back to the backend when apiUrl is blank.
    const base =
      (this.env.apiUrl && this.env.apiUrl.trim()) ||
      'https://serveiq-backend.onrender.com';
    const socket: Socket = io(`${base}/public`, {
      transports: ['websocket'],
      reconnection: true,
    });
    this.paymentSocket = socket;
    socket.on('connect', () =>
      socket.emit('subscribe:tab', { tabId, trackingCode }),
    );
    socket.on('paymentConfirmed', () => {
      this.disconnectPaymentSocket();
      this.onPaymentPaid();
    });
  }

  private disconnectPaymentSocket() {
    if (this.paymentSocket) {
      this.paymentSocket.removeAllListeners();
      this.paymentSocket.disconnect();
      this.paymentSocket = undefined;
    }
  }

  isDeclined(status: string): boolean {
    return status?.toLowerCase().includes('declined');
  }

  statusClass(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s.includes('pending')) return 'status-pending';
    if (s === 'approved') return 'status-approved';
    if (s === 'preparing') return 'status-preparing';
    if (s === 'ready_for_pickup' || s === 'out_for_delivery') return 'status-ready';
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
      out_for_delivery: 'On Its Way',
      delivered: 'Delivered',
      declined: 'Declined',
    };
    return labels[s] || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get orderStatusLabel(): string {
    if (this.isServed()) return 'Delivered';
    const s = this.step();
    const labels: Record<string, string> = {
      ordering: 'Ordering',
      pending_approval: 'Pending Approval',
      preparing: 'Being Prepared',
      ready: 'Ready for Pickup',
      on_the_way: 'On Its Way',
      payment: 'Awaiting Payment',
      paid: 'Paid',
    };
    return labels[s] || s;
  }

  get orderTypeLabel(): string {
    return this.tabData()?.tabType === 'takeaway' ? 'Takeaway' : 'Dine In';
  }

  get orderStatusIcon(): string {
    if (this.isServed()) return '🎉';
    const s = this.step();
    const icons: Record<string, string> = {
      ordering: '📋',
      pending_approval: '⏳',
      preparing: '👨‍🍳',
      ready: '✅',
      on_the_way: '🛵',
      payment: '💳',
      paid: '🎉',
    };
    return icons[s] || '📋';
  }
}