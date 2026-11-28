import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  OrdersApiService,
  AuthService,
  BranchesApiService,
  RealtimeSocketService,
} from '@serveiq/shared/data-access';
import { OrderGroup, OrderGroupItem, KitchenCrewMember } from '@serveiq/shared/models';
import { Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';

type KitchenTab = 'preparing' | 'ready';

@Component({
  selector: 'app-chef',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chef.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./chef.component.scss']
})
export class ChefComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ordersApi = inject(OrdersApiService);
  private authService = inject(AuthService);
  private branchesApi = inject(BranchesApiService);
  private socketSvc = inject(RealtimeSocketService);

  activeTab = signal<KitchenTab>('preparing');
  preparingOrders = signal<OrderGroup[]>([]);
  readyOrders = signal<OrderGroup[]>([]);
  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);
  businessName = signal(localStorage.getItem('businessName') || 'ServeIQ');
  activeChef = signal(localStorage.getItem('userName') || '');
  activeChefId = signal('');
  kitchenCrew = signal<KitchenCrewMember[]>([]);
  isKdsEnabled = signal(false);
  selectedStation = signal('All');
  muted = signal(localStorage.getItem('kds_muted') === '1');
  isProcessing = signal(false);

  stations = computed(() => {
    const names = new Set<string>();
    for (const order of this.preparingOrders()) {
      names.add(order.departmentName?.trim() || 'Unassigned');
    }
    return [...names].sort();
  });

  visibleOrders = computed(() => {
    const station = this.selectedStation();
    if (station === 'All') return this.preparingOrders();
    return this.preparingOrders().filter(
      (o) => (o.departmentName?.trim() || 'Unassigned') === station,
    );
  });

  claimableCount = computed(() =>
    this.preparingOrders().reduce(
      (n, o) => n + o.items.filter((i) => this.canAccept(i)).length,
      0,
    ),
  );

  readyCount = computed(() =>
    this.readyOrders().reduce((n, o) => n + o.items.length, 0),
  );

  private branchId = localStorage.getItem('branchId') || '';
  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private socket: Socket | null = null;
  private handlers: Record<string, (payload?: any) => void> = {};
  private audioCtx: AudioContext | null = null;
  private lastBeep = 0;

  constructor() {
    try {
      this.audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch {
      this.audioCtx = null;
    }
  }

  ngOnInit() {
    this.loadActiveChef();
    this.loadFeatureFlag();
    this.loadAll();
    this.pollSub = interval(15000).subscribe(() => this.loadAll());
    this.countdownInterval = setInterval(() => {
      this.preparingOrders.update((orders) => [...orders]);
    }, 1000);
    this.connectRealtime();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    for (const ev of Object.keys(this.handlers)) {
      this.socket?.off(ev, this.handlers[ev]);
    }
    this.socketSvc.disconnect();
  }

  private loadActiveChef() {
    this.authService.getMe().subscribe({
      next: (me) => {
        this.activeChef.set(me.fullName || me.email || this.activeChef());
        this.activeChefId.set(me.id || '');
      },
      error: () => null,
    });
  }

  private loadFeatureFlag() {
    if (!this.branchId) return;
    this.branchesApi.getFeatureFlags(this.branchId).subscribe({
      next: (flags) =>
        this.isKdsEnabled.set(
          !!(flags?.['kds_enabled'] || flags?.['kdsEnabled']),
        ),
      error: () => this.isKdsEnabled.set(false),
    });
  }

  private async connectRealtime() {
    const token = this.authService.getToken() ?? '';
    this.socket = await this.socketSvc.connect(token);
    if (this.branchId) {
      this.socket.emit('subscribe:orders', { branchId: this.branchId });
    }

    this.handlers['order:created'] = () => {
      this.beep();
      this.loadPreparing();
    };
    this.handlers['order:updated'] = () => this.loadAll();
    this.handlers['order:status'] = (payload: any) => {
      if (payload?.status === 'assigned_to_department') this.beep();
      this.loadAll();
    };
    for (const ev of Object.keys(this.handlers)) {
      this.socket.on(ev, this.handlers[ev]);
    }
  }

  private loadAll() {
    this.loadPreparing();
    this.loadReady();
    this.ordersApi.getKitchenCrew().subscribe({
      next: (crew) => this.kitchenCrew.set(crew || []),
      error: () => null,
    });
  }

  loadPreparing() {
    this.isLoadingPreparing.set(true);
    this.ordersApi.getPreparing().subscribe({
      next: (orders) => {
        this.preparingOrders.set(orders || []);
        this.isLoadingPreparing.set(false);
      },
      error: () => this.isLoadingPreparing.set(false),
    });
  }

  loadReady() {
    this.isLoadingReady.set(true);
    this.ordersApi.getReadyForPickup().subscribe({
      next: (orders) => {
        this.readyOrders.set(orders || []);
        this.isLoadingReady.set(false);
      },
      error: () => this.isLoadingReady.set(false),
    });
  }

  switchTab(tab: KitchenTab) {
    this.activeTab.set(tab);
    if (tab === 'preparing') this.loadPreparing();
    else this.loadReady();
  }

  toggleMute() {
    this.muted.set(!this.muted());
    localStorage.setItem('kds_muted', this.muted() ? '1' : '0');
  }

  setStation(station: string) {
    this.selectedStation.set(station);
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

  statusLabel(item: OrderGroupItem): string {
    switch (item.orderStatus) {
      case 'assigned_to_department': return 'Dispatched';
      case 'preparing': return 'Preparing';
      case 'ready_for_pickup': return 'Ready';
      case 'approved': return 'Approved';
      default: return item.orderStatus?.replace(/_/g, ' ') || 'New';
    }
  }

  openAcceptModal(items: OrderGroupItem[]) {
    const claimable = items.filter((i) => this.canAccept(i));
    if (!claimable.length || this.isProcessing()) return;

    const html = `
      <div style="text-align:left;">
        <p style="font-size:13px;color:#bccbb9;margin:0 0 12px;">
          Choose how long this will take to prepare. The timer starts when you confirm.
        </p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${[5, 10, 15, 25].map((t) => `<button type="button" class="chef-time-opt" data-time="${t}" style="flex:1;min-width:64px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#dce1fb;font-size:14px;font-weight:600;cursor:pointer;">${t} min</button>`).join('')}
        </div>
        <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
          <label for="chef-custom-time" style="font-size:12px;color:#bccbb9;">Custom</label>
          <input id="chef-custom-time" type="number" min="1" max="120" value="5" style="width:88px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#dce1fb;font-size:14px;">
          <span style="font-size:12px;color:#bccbb9;">minutes (1–120)</span>
        </div>
      </div>`;

    Swal.fire({
      title: claimable.length > 1 ? `Claim ${claimable.length} items` : 'Start preparing',
      html,
      showCancelButton: true,
      confirmButtonText: 'Start timer',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#0b1220',
      color: '#dce1fb',
      didOpen: () => {
        const buttons = document.querySelectorAll('.chef-time-opt');
        buttons.forEach((btn) => {
          btn.addEventListener('click', () => {
            buttons.forEach((b) => ((b as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'));
            (btn as HTMLElement).style.borderColor = '#4be277';
            const input = document.getElementById('chef-custom-time') as HTMLInputElement | null;
            if (input) input.value = (btn as HTMLElement).dataset['time'] || '5';
          });
        });
      },
      preConfirm: () => {
        const input = document.getElementById('chef-custom-time') as HTMLInputElement | null;
        const minutes = Number(input?.value);
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
          Swal.showValidationMessage('Choose between 1 and 120 minutes');
          return false;
        }
        return { seconds: Math.round(minutes * 60) };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.acceptItems(claimable, result.value.seconds);
      }
    });
  }

  private acceptItems(items: OrderGroupItem[], seconds: number) {
    this.isProcessing.set(true);
    let completed = 0;
    let failed = false;
    for (const item of items) {
      this.ordersApi.acceptOrder(item.id, {
        estimatedPreparationTimeSeconds: seconds,
      }).subscribe({
        next: () => {
          completed++;
          this.finishAccept(completed, items.length, failed);
        },
        error: () => {
          failed = true;
          completed++;
          this.finishAccept(completed, items.length, failed);
        },
      });
    }
  }

  private finishAccept(completed: number, total: number, failed: boolean) {
    if (completed < total) return;
    this.isProcessing.set(false);
    this.loadAll();
    if (failed) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Some items could not be claimed', showConfirmButton: false, timer: 2500, background: '#0b1220', color: '#fca5a5' });
    }
  }

  bumpItem(item: OrderGroupItem) {
    Swal.fire({
      title: 'Mark as ready for pickup?',
      text: `${item.quantity}x ${item.menuItemName}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, ready',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#0b1220',
      color: '#dce1fb',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.ordersApi.bumpOrder(item.id).subscribe({
        next: () => this.loadAll(),
        error: () => Swal.fire({ icon: 'error', title: 'Could not mark ready', background: '#0b1220', color: '#fca5a5' }),
      });
    });
  }

  getRemainingSeconds(item: OrderGroupItem): number {
    if (!item.timerEndsAt) return 0;
    const end = new Date(item.timerEndsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }

  formatCountdown(item: OrderGroupItem): string {
    const secs = this.getRemainingSeconds(item);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  initials(name: string): string {
    return (name || 'C')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private beep() {
    if (this.muted() || !this.audioCtx) return;
    const now = Date.now();
    if (now - this.lastBeep < 2000) return;
    this.lastBeep = now;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.6);
    } catch {
      return;
    }
  }
}
