import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackingApiService, TrackingData, PublicAdsApiService, Ad } from '@serveiq/shared/data-access';
import { interval, Subscription } from 'rxjs';

type TrackingErrorType = 'invalid_code' | 'not_found' | 'declined' | 'generic' | null;

interface Stage {
  key: string;
  label: string;
  icon: string;
  done: boolean;
  timestamp?: string;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-page">
      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading order status...</p>
        </div>
      } @else if (errorType()) {
        <div class="error">
          @if (errorType() === 'invalid_code') {
            <span class="material-symbols-outlined">qr_code_scanner</span>
            <h2>Invalid Tracking Code</h2>
            <p>The code you entered doesn't match the expected format (e.g. SVQ-XXXX-XXX).</p>
          } @else if (errorType() === 'not_found') {
            <span class="material-symbols-outlined">search_off</span>
            <h2>Order Not Found</h2>
            <p>No order was found with this tracking code. It may have expired or the code is incorrect.</p>
          } @else if (errorType() === 'declined') {
            <span class="material-symbols-outlined">cancel</span>
            <h2>Order Declined</h2>
            <p>{{ declinedReason() || 'The order was declined by the restaurant.' }}</p>
          } @else {
            <span class="material-symbols-outlined">error_outline</span>
            <h2>Something Went Wrong</h2>
            <p>Unable to load tracking information. Please try again later.</p>
          }
          <button class="back-btn" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Menu
          </button>
        </div>
      } @else {
        <header class="header">
          @if (trackingData()?.logoUrl) {
            <img [src]="trackingData()?.logoUrl" alt="Logo" class="logo" />
          }
          <h1>{{ trackingData()?.businessName }}</h1>
          <p class="subtitle">{{ trackingData()?.branchName }}</p>
        </header>

        <main class="content">
          <div class="tracking-hero">
            <span class="code-label">Tracking Code</span>
            <span class="code-value">{{ code() }}</span>
          </div>

          <div class="timeline-card">
            <h3>Order Progress</h3>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" [style.width.%]="progressPercent()"></div>
            </div>
            <div class="stages">
              @for (stage of stages(); track stage.key) {
                <div class="stage" [class.done]="stage.done" [class.active]="stage.key === currentStageKey()">
                  <div class="stage-icon">
                    @if (stage.done) {
                      <span class="material-symbols-outlined">check_circle</span>
                    } @else {
                      <span class="material-symbols-outlined">{{ stage.icon }}</span>
                    }
                  </div>
                  <div class="stage-info">
                    <span class="stage-label">{{ stage.label }}</span>
                    @if (stage.timestamp) {
                      <span class="stage-time">{{ formatTime(stage.timestamp) }}</span>
                    }
                  </div>
                </div>
              }
            </div>
            @if (isTerminal() && !isDeclined()) {
              <div class="delivered-banner">
                <span class="material-symbols-outlined">celebration</span>
                <span>Your order has been delivered! Enjoy your meal.</span>
              </div>
            }
          </div>

          @if (showCountdown()) {
            <div class="countdown-card">
              <span class="material-symbols-outlined">timer</span>
              <div>
                <p class="countdown-label">Estimated time remaining</p>
                <p class="countdown-value">{{ countdownLabel }}</p>
              </div>
            </div>
          }

          <div class="items-card" *ngIf="order()?.items?.length">
            <h3>Order Items</h3>
            <div class="item-list">
              @for (item of order()?.items; track item.id) {
                <div class="item-row">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span class="item-name">{{ item.menuItemName || item.menu_item_name || 'Item' }}</span>
                </div>
              }
            </div>
          </div>

          @if (ads().length > 0) {
            <div class="ads-card">
              <a [href]="currentAd()?.linkUrl" target="_blank" rel="noopener" class="ad-link">
                @if (currentAd()?.imageUrl) {
                  <img [src]="currentAd()?.imageUrl" [alt]="currentAd()?.title" class="ad-image" />
                }
                <p class="ad-title">{{ currentAd()?.title }}</p>
              </a>
            </div>
          }
        </main>

        <footer class="footer">
          <p>Powered by ServeIQ Mgt</p>
        </footer>
      }
    </div>
  `,
  styles: [`
    .tracking-page {
      min-height: 100vh;
      background: #f8f9fa;
      color: #1a1a2e;
      font-family: 'Inter', sans-serif;
    }
    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      color: #6c757d;
      text-align: center;
      padding: 24px;
    }
    .error { color: #dc3545; }
    .error h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
    .error p { margin: 0; font-size: 14px; max-width: 360px; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #e9ecef;
      border-top-color: #4be277;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .header {
      text-align: center;
      padding: 40px 24px 24px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .logo {
      width: 72px; height: 72px;
      object-fit: contain;
      border-radius: 14px;
      margin: 0 auto 14px;
      display: block;
      background: rgba(255,255,255,0.1);
    }
    .header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.7;
      margin: 0;
    }
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px 16px 80px;
    }
    .tracking-hero {
      text-align: center;
      padding: 24px;
      margin-bottom: 16px;
    }
    .code-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .code-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 3px;
    }
    .timeline-card {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .timeline-card h3 {
      font-family: 'Space Grotesk', sans-serif;
      margin: 0 0 16px;
      font-size: 18px;
    }
    .progress-bar-track {
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4be277, #22c55e);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .stages {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .stage {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 10px;
      background: #f8f9fa;
      transition: all 0.3s;
    }
    .stage.done {
      background: #e8f5e9;
    }
    .stage.active {
      background: #fff3e0;
      border: 1px solid #ffe0b2;
    }
    .stage-icon .material-symbols-outlined {
      font-size: 24px;
      color: #adb5bd;
    }
    .stage.done .stage-icon .material-symbols-outlined {
      color: #4be277;
    }
    .stage.active .stage-icon .material-symbols-outlined {
      color: #f97316;
    }
    .stage-info {
      display: flex;
      flex-direction: column;
    }
    .stage-label {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .stage-time {
      font-size: 11px;
      color: #6c757d;
      margin-top: 2px;
    }
    .stage.done .stage-label { color: #2e7d32; }
    .stage.active .stage-label { color: #e65100; }
    .delivered-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 16px;
      background: #e8f5e9;
      border-radius: 12px;
      color: #2e7d32;
      font-size: 14px;
      font-weight: 600;
    }
    .delivered-banner .material-symbols-outlined { color: #4be277; }
    .countdown-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .countdown-card .material-symbols-outlined {
      font-size: 32px;
      color: #f97316;
    }
    .countdown-label {
      margin: 0;
      font-size: 12px;
      color: #6c757d;
    }
    .countdown-value {
      margin: 2px 0 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .items-card {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .items-card h3 {
      font-family: 'Space Grotesk', sans-serif;
      margin: 0 0 12px;
      font-size: 18px;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .item-qty {
      font-weight: 700;
      color: #f97316;
      min-width: 28px;
    }
    .item-name {
      color: #1a1a2e;
    }
    .ads-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .ad-link {
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .ad-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .ad-title {
      margin: 0;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      background: #fff;
      color: #1a1a2e;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #adb5bd;
      font-size: 13px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      background: #1a1a2e;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class TrackingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trackingApi = inject(TrackingApiService);
  private adsApi = inject(PublicAdsApiService);

  code = signal('');
  isLoading = signal(true);
  errorType = signal<TrackingErrorType>(null);
  declinedReason = signal<string | null>(null);
  trackingData = signal<TrackingData | null>(null);
  ads = signal<Ad[]>([]);
  currentAdIndex = signal(0);

  private pollSub: Subscription | null = null;
  private countdownTick = signal(0);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private adRotateInterval: ReturnType<typeof setInterval> | null = null;

  order = computed(() => this.trackingData()?.order ?? null);

  stages = computed<Stage[]>(() => {
    const o = this.order();
    if (!o) return [];
    return [
      { key: 'received', label: 'Order Received', icon: 'receipt', done: true, timestamp: o.createdAt },
      { key: 'approved', label: 'Approved', icon: 'thumb_up', done: !!o.approvedAt, timestamp: o.approvedAt },
      { key: 'preparing', label: 'Preparing', icon: 'cooking', done: !!o.preparingAt, timestamp: o.preparingAt },
      { key: 'ready', label: 'On its way', icon: 'route', done: !!o.actualReadyTime, timestamp: o.actualReadyTime },
      { key: 'delivered', label: 'Delivered', icon: 'check_circle', done: !!o.deliveredAt, timestamp: o.deliveredAt },
    ];
  });

  currentStageKey = computed(() => {
    const s = this.stages();
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i].done) return s[i].key;
    }
    return s[0]?.key ?? 'received';
  });

  progressPercent = computed(() => {
    const s = this.stages();
    if (s.length === 0) return 0;
    const done = s.filter(st => st.done).length;
    return Math.round((done / s.length) * 100);
  });

  isDeclined = computed(() => this.order()?.status === 'DECLINED');
  isDelivered = computed(() => !!this.order()?.deliveredAt);
  isTerminal = computed(() => this.isDelivered() || this.isDeclined());

  showCountdown = computed(() => {
    const o = this.order();
    if (!o) return false;
    return !!o.timerEndsAt && !this.isTerminal();
  });

  get timerEndsAt(): string | null {
    return this.order()?.timerEndsAt ?? null;
  }

  get remainingSeconds(): number {
    const _ = this.countdownTick();
    const endsAt = this.timerEndsAt;
    if (!endsAt) return 0;
    return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  }

  get countdownLabel(): string {
    const s = this.remainingSeconds;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  currentAd = computed(() => {
    const list = this.ads();
    return list.length > 0 ? list[this.currentAdIndex() % list.length] : null;
  });

  private readonly TRACKING_CODE_REGEX = /^SVQ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{3}$/i;

  ngOnInit(): void {
    const rawCode = this.route.snapshot.paramMap.get('code') || '';
    if (!rawCode || !this.TRACKING_CODE_REGEX.test(rawCode)) {
      this.errorType.set('invalid_code');
      this.isLoading.set(false);
      return;
    }

    this.code.set(rawCode.toUpperCase());
    this.fetchTracking();
    this.startPolling();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.adRotateInterval) clearInterval(this.adRotateInterval);
  }

  private fetchTracking() {
    this.trackingApi.getTracking(this.code()).subscribe({
      next: (data) => {
        this.trackingData.set(data);
        if (data.order.status === 'DECLINED') {
          this.errorType.set('declined');
          this.declinedReason.set(data.order.declineReason || null);
        } else {
          this.errorType.set(null);
          this.loadAds(data.branchId);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 404) {
          this.errorType.set('not_found');
        } else {
          this.errorType.set('generic');
        }
      }
    });
  }

  private loadAds(branchId: string) {
    this.adsApi.getAds(branchId).subscribe({
      next: (ads) => {
        this.ads.set(ads);
        if (ads.length > 1) {
          this.adRotateInterval = setInterval(() => {
            this.currentAdIndex.update(i => i + 1);
          }, 20000);
        }
      },
      error: () => {}
    });
  }

  private startPolling() {
    this.pollSub = interval(5000).subscribe(() => {
      if (this.isTerminal()) {
        this.pollSub?.unsubscribe();
        return;
      }
      this.trackingApi.getTracking(this.code()).subscribe({
        next: (data) => {
          this.trackingData.set(data);
          if (data.order.status === 'DECLINED') {
            this.errorType.set('declined');
            this.declinedReason.set(data.order.declineReason || null);
          }
          if (!!data.order.deliveredAt || data.order.status === 'DECLINED') {
            this.pollSub?.unsubscribe();
          }
        },
        error: () => {}
      });
    });
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdownTick.update(n => n + 1);
    }, 1000);
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  }

  goBack() {
    this.router.navigate(['/public/menu', this.trackingData()?.branchId || '']);
  }
}
