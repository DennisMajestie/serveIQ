import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  OrdersApiService,
  AuthService,
  RealtimeSocketService,
  BranchesApiService,
} from '@serveiq/shared/data-access';
import { OrderGroup, OrderGroupItem } from '@serveiq/shared/models';
import { Socket } from 'socket.io-client';
import { interval, Subscription } from 'rxjs';
import { ThemeService } from '../core/theme.service';

interface DoneEntry {
  id: string;
  name: string;
  qty: number;
  table: string;
  finishedAt: Date;
}

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './kds.component.html',
  styleUrls: ['./kds.component.scss'],
})
export class KdsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ordersApi = inject(OrdersApiService);
  private auth = inject(AuthService);
  private socketSvc = inject(RealtimeSocketService);
  private branchesApi = inject(BranchesApiService);
  private themeService = inject(ThemeService);

  isDarkMode = signal(this.themeService.theme() === 'dark');

  preparing = signal<OrderGroup[]>([]);
  ready = signal<OrderGroup[]>([]);
  isLoading = signal(true);
  /** items recently completed on this board (across refreshes). */
  done = signal<DoneEntry[]>([]);
  /** branch kds_enabled feature flag, read from the branch settings. */
  isKdsEnabled = signal(false);

  muted = signal(localStorage.getItem('kds_muted') === '1');
  lastBeep = 0;

  private branchId = localStorage.getItem('branchId') || '';
  private socket: Socket | null = null;
  private handlers: Record<string, (payload?: any) => void> = {};
  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.setupAudio();
  }

  stations = computed(() => {
    const map = new Map<string, { name: string; orders: OrderGroup[] }>();
    for (const order of this.preparing()) {
      const name = order.departmentName?.trim() || 'Unassigned';
      if (!map.has(name)) {
        map.set(name, { name, orders: [] });
      }
      map.get(name)!.orders.push(order);
    }
    return [...map.values()];
  });

  ngOnInit() {
    this.loadAll();
    this.loadFeatureFlag();
    this.pollSub = interval(15000).subscribe(() => this.loadAll());
    this.countdownInterval = setInterval(() => {
      this.preparing.update((o) => [...o]);
    }, 1000);
    this.connectRealtime();
  }

  private loadFeatureFlag() {
    if (!this.branchId) return;
    this.branchesApi.getFeatureFlags(this.branchId).subscribe({
      next: (flags) => {
        this.isKdsEnabled.set(!!(flags?.['kds_enabled'] || flags?.['kdsEnabled']));
      },
      error: () => this.isKdsEnabled.set(false),
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    for (const ev of Object.keys(this.handlers)) {
      this.socket?.off(ev, this.handlers[ev]);
    }
    this.socketSvc.disconnect();
  }

  goBack() {
    this.router.navigate(['/app/dashboard']);
  }

  toggleMute() {
    this.muted.set(!this.muted());
    localStorage.setItem('kds_muted', this.muted() ? '1' : '0');
  }

  // ── realtime ──
  private connectRealtime() {
    const token = this.auth.getToken() ?? '';
    this.socket = this.socketSvc.connect(token);
    if (this.branchId) {
      this.socket.emit('subscribe:orders', { branchId: this.branchId });
    }

    this.handlers['order:created'] = () => {
      this.beep();
      this.loadPreparing();
      this.loadReady();
    };
    this.handlers['order:updated'] = () => {
      this.loadPreparing();
      this.loadReady();
    };
    this.handlers['order:status'] = (payload: any) => {
      if (payload?.status === 'assigned_to_department') {
        this.beep();
      }
      this.loadPreparing();
      this.loadReady();
    };

    for (const ev of Object.keys(this.handlers)) {
      this.socket.on(ev, this.handlers[ev]);
    }
  }

  private loadAll() {
    this.loadPreparing();
    this.loadReady();
  }

  loadPreparing() {
    this.ordersApi.getPreparing().subscribe({
      next: (orders) => {
        this.preparing.set(orders || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadReady() {
    this.ordersApi.getReadyForPickup().subscribe({
      next: (orders) => this.ready.set(orders || []),
      error: () => null,
    });
  }

  // ── actions ──
  hasUrgent(orders: OrderGroup[]): boolean {
    return orders.some((o) => o.items.some((i) => this.isUrgent(i)));
  }

  itemCount(orders: OrderGroup[]): number {
    return orders.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);
  }

  anyAcceptable(orders: OrderGroup[]): boolean {
    return orders.some((o) => o.items.some((i) => this.canAccept(i)));
  }

  anyBumpable(orders: OrderGroup[]): boolean {
    return orders.some((o) => o.items.some((i) => this.canBump(i)));
  }

  acceptAllStation(orders: OrderGroup[]) {
    for (const order of orders) {
      this.acceptAll(order);
    }
  }

  bumpAllStation(orders: OrderGroup[]) {
    for (const order of orders) {
      this.bumpAll(order);
    }
  }

  readyCount(): number {
    return this.ready().reduce(
      (n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0),
      0,
    );
  }

  statusClass(item: OrderGroupItem): string {
    switch (item.orderStatus) {
      case 'preparing':
        return 'status-preparing';
      case 'assigned_to_department':
        return 'status-dispatched';
      case 'approved':
        return 'status-approved';
      default:
        return 'status-new';
    }
  }

  canAccept(item: OrderGroupItem): boolean {
    return item.orderStatus === 'assigned_to_department';
  }

  canBump(item: OrderGroupItem): boolean {
    return (
      item.orderStatus === 'preparing' ||
      item.orderStatus === 'assigned_to_department' ||
      item.orderStatus === 'approved'
    );
  }

  acceptItem(group: OrderGroup, item: OrderGroupItem) {
    this.ordersApi.acceptOrder(item.id).subscribe({
      next: () => this.refreshAll(),
      error: () => this.loadAll(),
    });
  }

  acceptAll(group: OrderGroup) {
    const pending = group.items.filter((i) => this.canAccept(i));
    this.executeBatched(pending, (i) => this.ordersApi.acceptOrder(i.id));
  }

  bumpItem(group: OrderGroup, item: OrderGroupItem) {
    this.ordersApi.bumpOrder(item.id).subscribe({
      next: () => {
        this.addDone(item, group.tableNumber);
        this.refreshAll();
      },
      error: () => this.loadAll(),
    });
  }

  bumpAll(group: OrderGroup) {
    const pending = group.items.filter((i) => this.canBump(i));
    this.executeBatched(pending, (i) => this.ordersApi.bumpOrder(i.id));
  }

  private executeBatched(
    items: OrderGroupItem[],
    op: (item: OrderGroupItem) => ReturnType<OrdersApiService['bumpOrder']>,
  ) {
    let i = 0;
    const run = () => {
      if (i >= items.length) {
        this.refreshAll();
        return;
      }
      const item = items[i++];
      op(item).subscribe({ next: run, error: run });
    };
    run();
  }

  private refreshAll() {
    this.loadPreparing();
    this.loadReady();
  }

  private addDone(item: OrderGroupItem, table: string) {
    this.done.update((d) =>
      [
        {
          id: item.id,
          name: item.menuItemName,
          qty: item.quantity,
          table,
          finishedAt: new Date(),
        },
        ...d,
      ].slice(0, 12),
    );
  }

  // ── helpers ──
  isUrgent(item: OrderGroupItem): boolean {
    if (!item.timerEndsAt) return false;
    const secs = this.getRemainingSeconds(item.timerEndsAt);
    return secs <= 120;
  }

  getStatusLabel(item: OrderGroupItem): string {
    switch (item.orderStatus) {
      case 'assigned_to_department':
        return 'Dispatched';
      case 'preparing':
        return 'Preparing';
      case 'approved':
        return 'Approved';
      default:
        return 'New';
    }
  }

  getRemainingSeconds(iso: string): number {
    if (!iso) return 0;
    return Math.max(
      0,
      Math.floor((new Date(iso).getTime() - Date.now()) / 1000),
    );
  }

  formatCountdown(iso: string): string {
    const secs = this.getRemainingSeconds(iso);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── sound ──
  private setupAudio() {
    try {
      this.audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch {
      this.audioCtx = null;
    }
  }

  private beep() {
    if (this.muted() || !this.audioCtx) return;
    const now = Date.now();
    if (now - this.lastBeep < 2000) return;
    this.lastBeep = now;
    try {
      if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, this.audioCtx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioCtx!.currentTime + 0.6,
      );
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.start();
      osc.stop(this.audioCtx!.currentTime + 0.6);
    } catch {
      /* ignore audio errors */
    }
  }
}
