import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BranchesApiService, DashboardStats } from '@serveiq/shared/data-access';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  template: `
    <div class="dashboard-page">
      <!-- KPI Cards Grid -->
      <section class="kpi-grid" aria-label="Key Performance Indicators">
        <div class="kpi-header-row">
          <h2 class="kpi-title space-font">Dashboard Stats</h2>
          <button class="refresh-btn inter-font" (click)="loadStats()" [disabled]="isLoading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
        <div class="error-message" *ngIf="errorMessage()">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage() }}
        </div>
        <ng-container *ngIf="!isLoading(); else kpiSkeletons">
          <article class="kpi-card" *ngFor="let kpi of kpiCards()">
            <div class="kpi-icon-wrapper" [style.background]="kpi.iconBg + '15'">
              <mat-icon [style.color]="kpi.iconBg">{{ kpi.icon }}</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-header">
                <p class="kpi-label inter-font">{{ kpi.label }}</p>
                <span class="kpi-badge" *ngIf="kpi.subValue">{{ kpi.subValue }}</span>
              </div>
              <div class="kpi-value-wrapper">
                <span class="kpi-value space-font">{{ kpi.value }}</span>
              </div>
            </div>
          </article>
        </ng-container>
        <ng-template #kpiSkeletons>
          <div class="kpi-card" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton-shimmer" style="width: 48px; height: 48px; border-radius: 14px; margin-bottom: 12px;"></div>
            <div class="skeleton-shimmer" style="width: 60%; height: 14px; margin-bottom: 8px;"></div>
            <div class="skeleton-shimmer" style="width: 80%; height: 32px;"></div>
          </div>
        </ng-template>
      </section>

      <!-- Main Content Grid -->
      <section class="content-grid" aria-label="Dashboard content">
        <!-- Waiter Performance Card -->
        <article class="content-card waiter-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title space-font">Waiter Performance</h2>
              <p class="card-subtitle inter-font">Today's tabs and revenue per staff member</p>
            </div>
          </div>
          <div class="waiter-list" *ngIf="!isLoading(); else waiterSkeleton">
            <div class="waiter-row" *ngFor="let w of waiterPerformance()">
              <div class="waiter-avatar">
                <img [src]="w.waiter.avatarUrl || 'https://ui-avatars.com/api/?name=' + (w.waiter.fullName || 'S') + '&background=0b1c30&color=fff'" alt="">
              </div>
              <div class="waiter-info">
                <span class="waiter-name space-font">{{ w.waiter.fullName }}</span>
                <span class="waiter-meta inter-font">{{ w.tabsCount }} tab{{ w.tabsCount !== 1 ? 's' : '' }} closed</span>
              </div>
              <div class="waiter-revenue">
                <span class="amount space-font">₦{{ (w.revenueKobo / 100).toLocaleString() }}</span>
              </div>
            </div>
            <div class="waiter-empty" *ngIf="waiterPerformance().length === 0">
              <mat-icon>people_outline</mat-icon>
              <p>No waiter activity yet today</p>
            </div>
          </div>
          <ng-template #waiterSkeleton>
            <div class="waiter-list">
              <div class="waiter-row" *ngFor="let i of [1,2,3]">
                <div class="skeleton-shimmer" style="width: 44px; height: 44px; border-radius: 50%;"></div>
                <div class="waiter-info">
                  <div class="skeleton-shimmer" style="width: 120px; height: 14px; margin-bottom: 4px;"></div>
                  <div class="skeleton-shimmer" style="width: 80px; height: 12px;"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </article>

        <!-- Recent Orders Card -->
        <article class="content-card transactions-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title space-font">Recent Orders</h2>
              <p class="card-subtitle inter-font">Latest orders across all tabs</p>
            </div>
          </div>
          <div class="transactions-list" *ngIf="!isLoading(); else txnSkeletons">
            <div class="transaction-row" *ngFor="let order of recentOrders()">
              <div class="txn-avatar">
                <mat-icon style="color: #ff9800">restaurant</mat-icon>
              </div>
              <div class="txn-details">
                <span class="txn-title space-font">{{ order.menuItemName }}</span>
                <span class="txn-meta inter-font">x{{ order.quantity }} • {{ order.createdAt | date:'short' }}</span>
              </div>
              <div class="txn-amount">
                <span class="amount space-font">₦{{ (order.priceKobo / 100).toLocaleString() }}</span>
              </div>
            </div>
            <div class="txn-empty" *ngIf="recentOrders().length === 0">
              <mat-icon>receipt_long</mat-icon>
              <p>No orders yet today</p>
            </div>
          </div>
          <ng-template #txnSkeletons>
            <div class="transactions-list">
              <div class="transaction-row" *ngFor="let i of [1,2,3,4,5]">
                <div class="skeleton-shimmer" style="width: 44px; height: 44px; border-radius: 50%;"></div>
                <div class="txn-details">
                  <div class="skeleton-shimmer" style="width: 100px; height: 14px; margin-bottom: 4px;"></div>
                  <div class="skeleton-shimmer" style="width: 140px; height: 12px;"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </article>
      </section>

      <!-- Bottom Row -->
      <section class="bottom-grid" aria-label="Operational Pulse">
        <article class="content-card venue-status-card">
          <div class="venue-status-icon">
            <mat-icon [style.font-size.px]="48" [style.color]="occupancyPercent() >= 80 ? '#ef4444' : '#00D166'">table_restaurant</mat-icon>
          </div>
          <div class="venue-info">
            <div class="venue-header">
              <h3 class="space-font">Table Occupancy</h3>
              <p class="inter-font">{{ activeTables() }} of {{ totalTables() }} tables are currently occupied ({{ occupancyPercent() }}% capacity).</p>
            </div>
            <div class="occupancy-bar">
              <div class="occupancy-track">
                <div class="occupancy-fill" [style.width.%]="occupancyPercent()" [style.background]="occupancyPercent() >= 80 ? '#ef4444' : '#00D166'"></div>
              </div>
              <span class="occupancy-label inter-font">{{ occupancyPercent() }}%</span>
            </div>
            <div class="venue-chips">
              <span class="status-chip" [class.highlight]="occupancyPercent() >= 80" [class.chip-success]="occupancyPercent() < 80">
                {{ occupancyPercent() >= 80 ? 'NEAR CAPACITY' : 'ROOM AVAILABLE' }}
              </span>
              <span class="status-chip" *ngIf="openTabs() > 0">{{ openTabs() }} open tab{{ openTabs() !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </article>

        <article class="content-card revenue-card">
          <div class="revenue-icon-header">
            <mat-icon class="rev-icon">payments</mat-icon>
            <h3 class="space-font">Today's Revenue</h3>
          </div>
          <div class="revenue-amount space-font">₦{{ (dailyRevenue() / 100).toLocaleString() }}</div>
          <p class="inter-font">From {{ todayTabsCount() }} completed tab{{ todayTabsCount() !== 1 ? 's' : '' }}</p>
        </article>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --surface: #f8f9ff;
      --on-surface: #0b1c30;
      --on-surface-muted: #64748b;
      --primary: #00D166;
      --radius-xl: 28px;
    }

    .dashboard-page { padding-bottom: 40px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 40px; }
    .kpi-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .kpi-title { font-size: 1.5rem; color: var(--on-surface); margin: 0; }
    .refresh-btn { 
      display: flex; align-items: center; gap: 8px; 
      background: white; border: 1px solid #e2e8f0; border-radius: 8px; 
      padding: 8px 16px; cursor: pointer; font-size: 0.875rem;
      color: var(--on-surface-muted); transition: all 0.2s;
    }
    .refresh-btn:hover:not(:disabled) { 
      background: #f8f9ff; color: var(--on-surface); 
    }
    .refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .refresh-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .error-message {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;
      padding: 12px 16px; margin: 0 40px 24px; color: #b91c1c;
    }
    .error-message mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .kpi-card {
      background: white; border-radius: 20px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px; box-shadow: 0 8px 32px rgba(11, 28, 48, 0.04);
    }
    .kpi-icon-wrapper { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; }
    .kpi-label { font-size: 0.8125rem; font-weight: 500; color: var(--on-surface-muted); }
    .kpi-badge { font-size: 0.7rem; padding: 4px 8px; border-radius: 8px; background: #e8f5e9; color: #2e7d32; font-weight: 700; }
    .kpi-value { font-size: 2rem; color: var(--on-surface); }

    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 0 40px 40px; }
    .content-card { background: white; border-radius: var(--radius-xl); box-shadow: 0 8px 32px rgba(11, 28, 48, 0.04); padding: 32px; }
    .card-title { font-size: 1.5rem; margin: 0; color: var(--on-surface); }
    .card-subtitle { color: var(--on-surface-muted); font-size: 0.875rem; }

    .waiter-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .waiter-row { 
      display: flex; align-items: center; gap: 16px; padding: 16px; 
      background: #f8f9ff; border-radius: 16px; transition: transform 0.2s;
    }
    .waiter-row:hover { transform: scale(1.02); }
    .waiter-avatar img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .waiter-info { flex: 1; display: flex; flex-direction: column; }
    .waiter-name { font-size: 0.9375rem; font-weight: 700; color: var(--on-surface); }
    .waiter-meta { font-size: 0.75rem; color: var(--on-surface-muted); }
    .waiter-revenue { font-weight: 700; font-size: 0.9375rem; color: var(--on-surface); }
    .waiter-empty, .txn-empty { 
      display: flex; flex-direction: column; align-items: center; gap: 8px; 
      padding: 32px; color: var(--on-surface-muted); text-align: center;
    }
    .waiter-empty mat-icon, .txn-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .transactions-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .transaction-row { 
      display: flex; align-items: center; gap: 16px; padding: 16px; 
      background: #f8f9ff; border-radius: 16px; transition: transform 0.2s;
    }
    .transaction-row:hover { transform: scale(1.02); }
    .txn-avatar { 
      width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      background: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .txn-details { flex: 1; display: flex; flex-direction: column; }
    .txn-title { font-size: 0.9375rem; font-weight: 700; color: var(--on-surface); }
    .txn-meta { font-size: 0.75rem; color: var(--on-surface-muted); }
    .txn-amount { font-weight: 700; font-size: 0.9375rem; color: var(--on-surface); }

    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 0 40px 40px; }
    .venue-status-card { display: flex; gap: 24px; padding: 24px; align-items: center; background: #eef2ff; border: none; }
    .venue-status-icon { flex-shrink: 0; }
    .venue-info { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .venue-header h3 { margin: 0; font-size: 1.125rem; }
    .venue-header p { margin: 4px 0 0; font-size: 0.8125rem; color: var(--on-surface-muted); line-height: 1.4; }
    .occupancy-bar { display: flex; align-items: center; gap: 12px; }
    .occupancy-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .occupancy-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .occupancy-label { font-size: 0.8125rem; font-weight: 600; color: var(--on-surface); min-width: 36px; }
    .venue-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-chip { font-size: 0.7rem; font-weight: 700; padding: 4px 12px; border-radius: 8px; background: white; color: var(--on-surface-muted); }
    .status-chip.highlight { background: #fee2e2; color: #b91c1c; }
    .status-chip.chip-success { background: #e8f5e9; color: #2e7d32; }

    .revenue-card { background: #fffcf0; padding: 24px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .revenue-icon-header { display: flex; align-items: center; gap: 12px; color: #854d0e; }
    .revenue-icon-header h3 { margin: 0; font-size: 1.125rem; }
    .rev-icon { font-size: 24px; }
    .revenue-amount { font-size: 2rem; font-weight: 700; color: #854d0e; }
    .revenue-card p { font-size: 0.8125rem; color: #854d0e; line-height: 1.4; margin: 0; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private branchService = inject(BranchesApiService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    realTimeSales: 0,
    activeTables: 0,
    totalTables: 0,
    openTabs: 0,
    dailyRevenue: 0,
    todayTabsCount: 0,
    waiterPerformance: [],
    recentOrders: []
  });
  errorMessage = signal<string | null>(null);
  private pollingSub?: Subscription;

  ngOnInit() {
    this.loadStats();
    this.pollingSub = interval(30000).subscribe(() => this.loadStats());
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
  }

  loadStats() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.branchService.getStats().subscribe({
      next: (s: DashboardStats) => { this.stats.set(s); this.isLoading.set(false); },
      error: (error: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.status === 401 ? 'Unauthorized. Please login again.' : 'Failed to load dashboard stats.');
      }
    });
  }

  kpiCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Today\'s Revenue', value: `₦${(s.realTimeSales / 100).toLocaleString()}`, subValue: 'Sales', icon: 'payments', iconBg: '#00D166' },
      { label: 'Active Tables', value: s.activeTables.toString(), subValue: `of ${s.totalTables}`, icon: 'table_restaurant', iconBg: '#FF7043' },
      { label: 'Open Tabs', value: s.openTabs.toString(), subValue: 'Current', icon: 'receipt_long', iconBg: '#0059bb' },
      { label: 'Tabs Completed', value: s.todayTabsCount.toString(), subValue: 'Today', icon: 'check_circle', iconBg: '#8b5cf6' }
    ];
  });

  waiterPerformance = computed(() => this.stats().waiterPerformance || []);
  recentOrders = computed(() => (this.stats().recentOrders || []).slice(0, 10));
  activeTables = computed(() => this.stats().activeTables);
  totalTables = computed(() => this.stats().totalTables);
  openTabs = computed(() => this.stats().openTabs);
  dailyRevenue = computed(() => this.stats().dailyRevenue);
  todayTabsCount = computed(() => this.stats().todayTabsCount);
  occupancyPercent = computed(() => {
    const total = this.totalTables();
    if (total === 0) return 0;
    return Math.round((this.activeTables() / total) * 100);
  });
}
