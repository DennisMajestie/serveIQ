import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrdersApiService, AuthService, RealtimeSocketService } from '@serveiq/shared/data-access';
import { OrderGroup, OrderGroupItem } from '@serveiq/shared/models';
import { Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';
import { CurrencyContextService } from '../services/currency-context.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="orders-page">
      <header class="orders-header">
        <div class="header-left">
          <button class="icon-btn" (click)="goBack()" aria-label="Back">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1>My Active Orders</h1>
            <p>{{ orders().length }} open {{ orders().length === 1 ? 'order' : 'orders' }} · live</p>
          </div>
        </div>
        <button class="icon-btn" (click)="loadOrders()" aria-label="Refresh">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </header>

      <div class="toolbar">
        <input type="search" [(ngModel)]="search" placeholder="Search table or tracking code" class="search-input" />
        <span class="live-pill"><span class="live-dot"></span> Live</span>
      </div>

      @if (isLoading()) {
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      } @else if (visibleOrders().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">receipt_long</span>
          <h3>No active orders</h3>
          <p>Orders you open will appear here with their tracking codes until they are completed.</p>
        </div>
      } @else {
        <div class="orders-list">
          @for (group of visibleOrders(); track group.tabId + group.createdAt) {
            <article class="order-card">
              <div class="card-head">
                <div>
                  <span class="table-label">{{ group.tabType === 'takeaway' ? 'Takeaway' : 'Table ' + (group.tableNumber || '—') }}</span>
                  <span class="created">{{ formatTime(group.createdAt) }}</span>
                </div>
                <span class="total">{{ currency.formatKobo(group.totalKobo || 0) }}</span>
              </div>

              <div class="tracking-row">
                <span class="tracking-label">Tracking code</span>
                <code>{{ group.trackingCode || 'Not generated' }}</code>
                @if (group.trackingCode) {
                  <button class="copy-btn" (click)="copyTracking(group.trackingCode!)" aria-label="Copy tracking code">
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                }
              </div>

              <div class="meta-row">
                @if (group.customerName) { <span class="meta-chip">person {{ group.customerName }}</span> }
                @if (group.departmentName) { <span class="meta-chip">kitchen {{ group.departmentName }}</span> }
                @if (group.tabType === 'takeaway' && group.pickupMode) { <span class="meta-chip">{{ group.pickupMode }}</span> }
              </div>

              <div class="items">
                @for (item of group.items; track item.id) {
                  <div class="item-row">
                    <span class="qty">{{ item.quantity }}x</span>
                    <span class="name">{{ item.menuItemName }}</span>
                    <span class="status" [ngClass]="'status-' + statusKey(item)">{{ statusLabel(item) }}</span>
                  </div>
                  @if (item.notes) { <div class="note">{{ item.notes }}</div> }
                }
              </div>

              @if (group.timerEndsAt) {
                <div class="timer-row">
                  <span class="material-symbols-outlined">schedule</span>
                  <span>Kitchen timer</span>
                  <strong [class.urgent]="getRemainingSeconds(group.timerEndsAt) <= 120">{{ formatCountdown(group.timerEndsAt) }}</strong>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .orders-page { min-height: 100vh; background: #020617; color: #dce1fb; font-family: 'Inter', sans-serif; padding-bottom: 96px; }
    .orders-header { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 20px; background: rgba(2,6,23,0.92); backdrop-filter: blur(32px); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .header-left { display: flex; align-items: center; gap: 12px; }
    h1 { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 600; color: #4be277; }
    .orders-header p { margin: 2px 0 0; font-size: 11px; color: #bccbb9; }
    .icon-btn { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 999px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #dce1fb; cursor: pointer; }
    .icon-btn:hover { border-color: rgba(75,226,119,0.4); }
    .toolbar { display: flex; align-items: center; gap: 12px; padding: 16px 20px 0; }
    .search-input { flex: 1; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #dce1fb; font-size: 13px; outline: none; }
    .search-input:focus { border-color: rgba(75,226,119,0.5); }
    .live-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #4be277; }
    .live-dot { width: 7px; height: 7px; border-radius: 999px; background: #4be277; box-shadow: 0 0 10px #4be277; }
    .orders-list { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; }
    .order-card { padding: 16px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .table-label { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; }
    .created { font-size: 11px; color: #bccbb9; }
    .total { font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: #4be277; }
    .tracking-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px 10px; border-radius: 12px; background: rgba(75,226,119,0.08); }
    .tracking-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #bccbb9; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #4be277; flex: 1; }
    .copy-btn { border: none; background: transparent; color: #4be277; cursor: pointer; }
    .copy-btn .material-symbols-outlined { font-size: 18px; }
    .meta-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
    .meta-chip { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: rgba(173,198,255,0.1); color: #adc6ff; }
    .items { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
    .item-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); font-size: 12px; }
    .qty { color: #4be277; font-weight: 700; }
    .name { flex: 1; }
    .status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #adc6ff; }
    .status-preparing, .status-assigned_to_department { color: #4be277; }
    .status-ready_for_pickup, .status-out_for_delivery { color: #fbbf24; }
    .note { font-size: 11px; font-style: italic; color: #bccbb9; padding-left: 8px; }
    .timer-row { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: #bccbb9; }
    .timer-row .material-symbols-outlined { font-size: 16px; }
    .timer-row strong { margin-left: auto; font-family: 'JetBrains Mono', monospace; color: #4be277; }
    .timer-row strong.urgent { color: #ef4444; }
    .skeleton { height: 120px; margin: 16px 20px; border-radius: 20px; background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; color: #bccbb9; }
    .empty-state .material-symbols-outlined { font-size: 48px; opacity: 0.4; margin-bottom: 12px; }
    .empty-state h3 { margin: 0 0 6px; font-family: 'Space Grotesk', sans-serif; color: #dce1fb; font-size: 16px; }
    .empty-state p { margin: 0; font-size: 12px; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
  `]
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ordersApi = inject(OrdersApiService);
  private authService = inject(AuthService);
  private socketSvc = inject(RealtimeSocketService);
  readonly currency = inject(CurrencyContextService);

  orders = signal<OrderGroup[]>([]);
  isLoading = signal(false);
  search = '';

  visibleOrders = computed(() => {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.orders();
    return this.orders().filter((group) =>
      [group.tableNumber, group.trackingCode, group.customerName, group.waiterName, ...group.items.map((i) => i.menuItemName)]
        .some((value) => (value || '').toLowerCase().includes(term)),
    );
  });

  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private socket: Socket | null = null;
  private handlers: Record<string, (payload?: any) => void> = {};
  private branchId = localStorage.getItem('branchId') || '';

  ngOnInit() {
    this.loadOrders();
    this.pollSub = interval(15000).subscribe(() => this.loadOrders());
    this.countdownInterval = setInterval(() => {
      this.orders.update((list) => [...list]);
    }, 1000);
    this.connectRealtime();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    for (const ev of Object.keys(this.handlers)) this.socket?.off(ev, this.handlers[ev]);
    this.socketSvc.disconnect();
  }

  private async connectRealtime() {
    this.socket = await this.socketSvc.connect(this.authService.getToken() ?? '');
    if (this.branchId) this.socket.emit('subscribe:orders', { branchId: this.branchId });
    this.handlers['order:updated'] = () => this.loadOrders();
    this.handlers['order:status'] = () => this.loadOrders();
    for (const ev of Object.keys(this.handlers)) this.socket.on(ev, this.handlers[ev]);
  }

  loadOrders() {
    this.isLoading.set(true);
    this.ordersApi.getActiveOrders({ per_page: 100 }).subscribe({
      next: (orders) => {
        this.orders.set(orders || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  statusKey(item: OrderGroupItem): string {
    return (item.orderStatus || 'new').toLowerCase();
  }

  statusLabel(item: OrderGroupItem): string {
    const status = (item.orderStatus || 'new').toLowerCase();
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getRemainingSeconds(iso?: string): number {
    if (!iso) return 0;
    return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  }

  formatCountdown(iso?: string): string {
    const secs = this.getRemainingSeconds(iso);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  async copyTracking(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tracking code copied', showConfirmButton: false, timer: 1800, background: '#0b1220', color: '#4be277' });
    } catch {
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: code, showConfirmButton: false, timer: 2500, background: '#0b1220', color: '#dce1fb' });
    }
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}
