import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrdersApiService, AuthService } from '@serveiq/shared/data-access';
import { OrderGroup } from '@serveiq/shared/models';
import { interval, Subscription } from 'rxjs';

type KitchenTab = 'preparing' | 'ready';

@Component({
  selector: 'app-chef',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chef.component.html',
  styleUrls: ['./chef.component.scss']
})
export class ChefComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ordersApi = inject(OrdersApiService);
  private authService = inject(AuthService);

  activeTab = signal<KitchenTab>('preparing');

  preparingOrders = signal<OrderGroup[]>([]);
  readyOrders = signal<OrderGroup[]>([]);

  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);

  businessName = signal(localStorage.getItem('businessName') || 'ServeIQ');

  departments = computed(() => {
    const depts = new Map<string, OrderGroup[]>();
    for (const order of this.preparingOrders()) {
      const dept = order.departmentName || 'Unassigned';
      if (!depts.has(dept)) depts.set(dept, []);
      depts.get(dept)!.push(order);
    }
    return depts;
  });

  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadAll();
    this.pollSub = interval(15000).subscribe(() => {
      this.loadPreparing();
      this.loadReady();
    });
    this.countdownInterval = setInterval(() => {
      this.preparingOrders.update(orders => [...orders]);
    }, 1000);
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private loadAll() {
    this.loadPreparing();
    this.loadReady();
  }

  loadPreparing() {
    this.isLoadingPreparing.set(true);
    this.ordersApi.getPreparing().subscribe({
      next: (orders) => { this.preparingOrders.set(orders || []); this.isLoadingPreparing.set(false); },
      error: () => this.isLoadingPreparing.set(false)
    });
  }

  loadReady() {
    this.isLoadingReady.set(true);
    this.ordersApi.getReadyForPickup().subscribe({
      next: (orders) => { this.readyOrders.set(orders || []); this.isLoadingReady.set(false); },
      error: () => this.isLoadingReady.set(false)
    });
  }

  switchTab(tab: KitchenTab) {
    this.activeTab.set(tab);
    if (tab === 'preparing') this.loadPreparing();
    else this.loadReady();
  }

  getRemainingSeconds(group: OrderGroup): number {
    if (!group.timerEndsAt) return 0;
    const end = new Date(group.timerEndsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }

  formatCountdown(group: OrderGroup): string {
    const secs = this.getRemainingSeconds(group);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
