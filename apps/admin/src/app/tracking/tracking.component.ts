import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackingApiService, TrackingData, PublicAdsApiService, Ad } from '@serveiq/shared/data-access';
import { interval, Subscription } from 'rxjs';

interface ConfettiParticle { x: number; y: number; r: number; color: string; d: number; tilt: number; tiltAngle: number; }

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
    <div class="page">
      @if (isLoading()) {
        <div class="state-view">
          <div class="spinner"></div>
          <p class="state-text">Loading order status...</p>
        </div>
      } @else if (errorType()) {
        <div class="state-view">
          @if (errorType() === 'invalid_code') {
            <span class="material-symbols-outlined state-icon">qr_code_scanner</span>
            <h2 class="state-heading">Invalid Code</h2>
            <p class="state-desc">The code doesn't match the expected format.</p>
          } @else if (errorType() === 'not_found') {
            <span class="material-symbols-outlined state-icon">search_off</span>
            <h2 class="state-heading">Not Found</h2>
            <p class="state-desc">No order was found with this tracking code.</p>
          } @else if (errorType() === 'declined') {
            <span class="material-symbols-outlined state-icon">cancel</span>
            <h2 class="state-heading">Order Declined</h2>
            <p class="state-desc">{{ declinedReason() || 'The order was declined by the restaurant.' }}</p>
          } @else {
            <span class="material-symbols-outlined state-icon">error_outline</span>
            <h2 class="state-heading">Something Went Wrong</h2>
            <p class="state-desc">Unable to load tracking information.</p>
          }
          <button class="btn-back" (click)="goBack()">
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

        <div class="body">
          <div class="code-pill">{{ code() }}</div>

          <div class="stepper">
            @for (stage of stages(); track stage.key; let i = $index; let last = $last) {
              <div class="step" [class.done]="stage.done" [class.active]="stage.key === currentStageKey()">
                <div class="step-indicator">
                  <div class="step-dot">
                    @if (stage.done) {
                      <span class="material-symbols-outlined step-icon">check</span>
                    }
                  </div>
                  @if (!last) {
                    <div class="step-line" [class.filled]="stage.done"></div>
                  }
                </div>
                <span class="step-label">{{ stage.label }}</span>
              </div>
            }
          </div>

          @if (paymentAccountNumber()) {
            <div class="account-card" (click)="copyAccountNumber()">
              <div class="account-label">Pay to this account</div>
              <div class="account-number">{{ paymentAccountNumber() }}</div>
              <div class="account-copy">
                <span class="material-symbols-outlined account-copy-icon">{{ copied() ? 'check' : 'content_copy' }}</span>
                <span>{{ copied() ? 'Copied!' : 'Tap to copy' }}</span>
              </div>
            </div>
          }

          @if (isTerminal() && !isDeclined()) {
            <div class="delivered-msg">
              <span class="material-symbols-outlined">celebration</span>
              <span>Enjoy your meal!</span>
            </div>
            <canvas id="confettiCanvas" class="confetti-canvas"></canvas>
          }

          @if (showCountdown()) {
            <div class="countdown">
              <span class="material-symbols-outlined cntdwn-icon">schedule</span>
              <span class="cntdwn-value">{{ countdownLabel }}</span>
              <span class="cntdwn-label">remaining</span>
            </div>
          }

          @if (order()?.items?.length) {
            <div class="items-row">
              @for (item of order()?.items!; track item.id; let i = $index; let total = $count) {
                @if (i < 3) {
                  <span class="item-chip">{{ item.quantity }}<span class="item-times">x</span>{{ item.menuItemName || item.menu_item_name || 'Item' }}</span>
                  @if (i < total - 1 && i < 2) {
                    <span class="item-sep">&bull;</span>
                  }
                }
              }
              @if ((order()?.items?.length ?? 0) > 3) {
                <span class="item-more">+{{ (order()?.items?.length ?? 0) - 3 }} more</span>
              }
            </div>
          }
        </div>

        @if (ads().length > 0) {
          <div class="ads-strip">
            <div class="ads-banner">
              <a [href]="currentAd()?.linkUrl" target="_blank" rel="noopener" class="ad-link">
                <img [src]="currentAd()?.imageUrl" [alt]="currentAd()?.title" class="ad-image" />
                <div class="ad-overlay">
                  <p class="ad-title">{{ currentAd()?.title }}</p>
                </div>
              </a>
              @if (ads().length > 1) {
                <div class="ad-dots">
                  @for (ad of ads(); track ad.id; let i = $index) {
                    <span class="dot" [class.active]="i === currentAdIndex()" (click)="currentAdIndex.set(i)"></span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <button class="footer-back" (click)="goBack()">Back to Menu</button>
      }
    </div>
  `,
  styles: [`
    .page {
      height: 100dvh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #f5f2ed;
      color: #1a1515;
      font-family: 'Inter', sans-serif;
    }

    .state-view {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
      color: #8c7e72;
    }
    .state-icon {
      font-size: 48px;
      color: #d4cfc9;
    }
    .state-heading {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1a1515;
    }
    .state-desc {
      margin: 0;
      font-size: 14px;
      max-width: 320px;
      line-height: 1.5;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e5dfd8;
      border-top-color: #d97706;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .header {
      text-align: center;
      padding: 24px 24px 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      flex-shrink: 0;
    }
    .logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 14px;
      margin: 0 auto 10px;
      display: block;
      background: rgba(255,255,255,0.1);
    }
    .header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .header .subtitle {
      font-size: 13px;
      opacity: 0.7;
      margin: 0;
    }

    .ads-strip {
      flex-shrink: 0;
      background: #1a1a2e;
      padding: 0 16px;
    }
    .ads-banner {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
      border-radius: 0 0 16px 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      aspect-ratio: 16 / 7;
      background: #16213e;
    }
    .ads-banner .ad-link {
      display: block;
      width: 100%;
      height: 100%;
      text-decoration: none;
    }
    .ads-banner .ad-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.5s ease;
    }
    .ads-banner .ad-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px 16px 12px;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
    }
    .ads-banner .ad-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .ad-dots {
      position: absolute;
      bottom: 6px;
      right: 14px;
      display: flex;
      gap: 6px;
    }
    .ad-dots .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      cursor: pointer;
      transition: all 0.3s;
    }
    .ad-dots .dot.active {
      background: #fff;
      transform: scale(1.3);
    }

    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      gap: 12px;
      min-height: 0;
    }

    .code-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #8c7e72;
      background: #fff;
      padding: 4px 14px;
      border-radius: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .stepper {
      display: flex;
      align-items: flex-start;
      width: 100%;
      max-width: 400px;
      padding: 4px 0;
    }
    .step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .step-indicator {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #d4cfc9;
      background: #f5f2ed;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .step.done .step-dot {
      background: #059669;
      border-color: #059669;
    }
    .step.active .step-dot {
      background: #d97706;
      border-color: #d97706;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(217,119,6,0); }
    }
    .step-icon {
      font-size: 16px !important;
      color: #fff;
      font-weight: 700;
    }
    .step-line {
      flex: 1;
      height: 2px;
      background: #e5dfd8;
      margin: 0 -1px;
      transition: background 0.3s;
    }
    .step-line.filled {
      background: #059669;
    }
    .step-label {
      font-size: 10px;
      color: #8c7e72;
      margin-top: 6px;
      text-align: center;
      white-space: nowrap;
      font-weight: 500;
    }
    .step.done .step-label {
      color: #059669;
    }
    .step.active .step-label {
      color: #d97706;
      font-weight: 600;
    }

    .delivered-msg {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #f0fdf4;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #059669;
      position: relative;
      z-index: 1;
    }
    .delivered-msg .material-symbols-outlined {
      font-size: 18px;
      color: #059669;
    }
    .confetti-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    }

    .countdown {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fffbeb;
      padding: 6px 16px;
      border-radius: 20px;
    }
    .cntdwn-icon {
      font-size: 18px !important;
      color: #d97706;
    }
    .cntdwn-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      color: #d97706;
    }
    .cntdwn-label {
      font-size: 11px;
      color: #8c7e72;
    }

    .account-card {
      background: #fff;
      border: 1px solid #e5dfd8;
      border-radius: 16px;
      padding: 14px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      max-width: 280px;
      width: 100%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .account-card:hover {
      border-color: #d97706;
      box-shadow: 0 2px 10px rgba(217,119,6,0.12);
    }
    .account-card:active {
      transform: scale(0.97);
    }
    .account-label {
      font-size: 11px;
      color: #8c7e72;
      font-weight: 500;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .account-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #1a1515;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .account-copy {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 11px;
      color: #d97706;
      font-weight: 600;
    }
    .account-copy-icon {
      font-size: 14px !important;
    }

    .items-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;
    }
    .item-chip {
      font-size: 12px;
      color: #1a1515;
      background: #fff;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .item-times {
      margin-right: 1px;
    }
    .item-sep {
      color: #d4cfc9;
      font-size: 12px;
    }
    .item-more {
      font-size: 11px;
      color: #8c7e72;
    }

    .footer-back {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      padding: 10px;
      border: none;
      background: none;
      color: #8c7e72;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .footer-back:hover {
      color: #1a1515;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 18px;
      border: none;
      border-radius: 10px;
      background: #1a1515;
      color: #faf8f5;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {
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

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;
  private confettiColors = ['#f97316', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#facc15'];
  private confettiLaunched = false;

  paymentAccountNumber = computed(() => this.trackingData()?.paymentAccountNumber ?? '');
  copied = signal(false);
  order = computed(() => this.trackingData()?.order ?? null);

  stages = computed<Stage[]>(() => {
    const o = this.order();
    if (!o) return [];
    return [
      { key: 'received', label: 'Received', icon: 'receipt', done: true, timestamp: o.createdAt },
      { key: 'approved', label: 'Approved', icon: 'thumb_up', done: !!o.approvedAt, timestamp: o.approvedAt },
      { key: 'preparing', label: 'Preparing', icon: 'cooking', done: !!o.preparingAt, timestamp: o.preparingAt },
      { key: 'ready', label: 'Ready', icon: 'route', done: !!o.actualReadyTime, timestamp: o.actualReadyTime },
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

  ngAfterViewInit(): void {
    this.tryLaunchConfetti();
  }

  private tryLaunchConfetti() {
    if (this.confettiLaunched) return;
    if (!this.isDelivered()) return;
    this.initConfetti();
  }

  private initConfetti() {
    this.canvas = document.getElementById('confettiCanvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.launchConfetti();
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private launchConfetti() {
    if (!this.canvas) return;
    this.confettiLaunched = true;
    for (let i = 0; i < 200; i++) {
      this.particles.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height - this.canvas.height, r: Math.random() * 8 + 4, color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)], d: Math.random() * 10 + 5, tilt: Math.random() * 10 - 5, tiltAngle: 0 });
    }
    this.animate();
    setTimeout(() => this.stopConfetti(), 5000);
  }

  private animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      p.tiltAngle += 0.1; p.y += p.d; p.tilt = Math.sin(p.tiltAngle) * 15;
      this.ctx.beginPath(); this.ctx.lineWidth = p.r; this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt - p.r / 2, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    }
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private stopConfetti() {
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.adRotateInterval) clearInterval(this.adRotateInterval);
    this.stopConfetti();
  }

  private fetchTracking() {
    this.trackingApi.getTracking(this.code()).subscribe({
      next: (data) => {
        console.log('[Tracking] tracking data received:', data);
        this.trackingData.set(data);
        if (data.order.status === 'DECLINED') {
          this.errorType.set('declined');
          this.declinedReason.set(data.order.declineReason || null);
        } else {
          this.errorType.set(null);
          this.loadAds(data.branchId);
        }
        this.isLoading.set(false);
        this.tryLaunchConfetti();
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
    console.log('[Tracking] loadAds called with branchId:', branchId);
    this.adsApi.getAds(branchId).subscribe({
      next: (ads) => {
        console.log('[Tracking] ads response:', ads);
        this.ads.set(ads);
          if (ads.length > 1) {
            this.adRotateInterval = setInterval(() => {
              this.currentAdIndex.update(i => i + 1);
            }, 5000);
          }
      },
      error: (err) => {
        console.error('[Tracking] ads load error:', err);
      }
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
          this.tryLaunchConfetti();
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

  copyAccountNumber() {
    const num = this.paymentAccountNumber();
    if (!num) return;
    navigator.clipboard.writeText(num).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => {});
  }
}
