import { Component, signal, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BranchesApiService, ReportsApiService, DashboardStats } from '@serveiq/shared/data-access';
import { PeakHoursEntry } from '@serveiq/shared/models';
import { Subscription, interval } from 'rxjs';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  template: `
    <div class="page-wrapper">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <span>Admin</span>
        <span class="separator">›</span>
        <span class="current">Dashboard</span>
      </nav>

      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Overview of today's restaurant performance</p>
        </div>
        <button class="btn-action" (click)="loadStats(); loadPeakHours()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="error-message" *ngIf="errorMessage()">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage() }}
      </div>

      <ng-container *ngIf="!isLoading(); else statsSkeleton">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let kpi of kpiCards()">
            <div class="icon-wrap" [style.background]="kpi.iconBg + '15'">
              <mat-icon [style.color]="kpi.iconBg">{{ kpi.icon }}</mat-icon>
            </div>
            <div class="card-info">
              <div class="label">{{ kpi.label }}</div>
              <div class="value">{{ kpi.value }}</div>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #statsSkeleton>
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton-shimmer" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>
            <div style="flex: 1;">
              <div class="skeleton-shimmer" style="width: 60%; height: 12px; margin-bottom: 6px;"></div>
              <div class="skeleton-shimmer" style="width: 80%; height: 24px;"></div>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- Peak Hours -->
      <div class="section-card">
        <div class="section-header">
          <h2>Peak Hours</h2>
          <p>Hourly order volume from completed tabs</p>
        </div>
        <div class="chart-wrapper">
          <canvas #peakHoursCanvas></canvas>
        </div>
      </div>

      <!-- Bottom Grid: Waiter Performance + Recent Orders -->
      <div class="bottom-grid">
        <div class="section-card">
          <div class="section-header">
            <h2>Waiter Performance</h2>
            <p>Today's tabs and revenue per staff member</p>
          </div>
          <div class="waiter-list" *ngIf="!isLoading(); else waiterSkeleton">
            <div class="waiter-row" *ngFor="let w of waiterPerformance()">
              <div class="waiter-avatar">
                <img [src]="w.waiter.avatarUrl || 'https://ui-avatars.com/api/?name=' + (w.waiter.fullName || 'S') + '&background=0b1c30&color=fff'" alt="">
              </div>
              <div class="waiter-info">
                <span class="waiter-name">{{ w.waiter.fullName }}</span>
                <span class="waiter-meta">{{ w.tabsCount }} tab{{ w.tabsCount !== 1 ? 's' : '' }} closed</span>
              </div>
              <div class="waiter-revenue">
                <span class="amount">₦{{ (w.revenueKobo / 100).toLocaleString() }}</span>
              </div>
            </div>
            <div class="waiter-empty" *ngIf="waiterPerformance().length === 0">
              <mat-icon>people_outline</mat-icon>
              <p>No waiter activity yet today</p>
            </div>
            <div class="view-all-row">
              <a routerLink="/staff">View all staff →</a>
            </div>
          </div>
          <ng-template #waiterSkeleton>
            <div class="waiter-list">
              <div class="waiter-row" *ngFor="let i of [1,2,3]">
                <div class="skeleton-shimmer" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                <div style="flex: 1;">
                  <div class="skeleton-shimmer" style="width: 120px; height: 14px; margin-bottom: 4px;"></div>
                  <div class="skeleton-shimmer" style="width: 80px; height: 12px;"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h2>Recent Orders</h2>
            <p>Latest orders across all tabs</p>
          </div>
          <div class="transactions-list" *ngIf="!isLoading(); else txnSkeletons">
            <div class="transaction-row" *ngFor="let order of recentOrders()">
              <div class="txn-avatar">
                <mat-icon style="color: #ff9800">restaurant</mat-icon>
              </div>
              <div class="txn-details">
                <span class="txn-title">{{ order.menuItemName }}</span>
                <span class="txn-meta">x{{ order.quantity }} • {{ order.createdAt | date:'short' }}</span>
              </div>
              <div class="txn-amount">
                <span class="amount">₦{{ (order.subtotalKobo / 100).toLocaleString() }}</span>
              </div>
            </div>
            <div class="txn-empty" *ngIf="recentOrders().length === 0">
              <mat-icon>receipt_long</mat-icon>
              <p>No orders yet today</p>
            </div>
            <div class="view-all-row">
              <a routerLink="/tables">View all orders →</a>
            </div>
          </div>
          <ng-template #txnSkeletons>
            <div class="transactions-list">
              <div class="transaction-row" *ngFor="let i of [1,2,3,4,5]">
                <div class="skeleton-shimmer" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                <div style="flex: 1;">
                  <div class="skeleton-shimmer" style="width: 100px; height: 14px; margin-bottom: 4px;"></div>
                  <div class="skeleton-shimmer" style="width: 140px; height: 12px;"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Operational Section: Occupancy + Revenue -->
      <div class="ops-grid">
        <div class="venue-status-card">
          <div class="venue-status-icon">
            <mat-icon [style.font-size.px]="48" [style.color]="occupancyPercent() >= 80 ? '#ef4444' : '#00D166'">table_restaurant</mat-icon>
          </div>
          <div class="venue-info">
            <div class="venue-header">
              <h3>Table Occupancy</h3>
              <p>{{ activeTables() }} of {{ totalTables() }} tables are currently occupied ({{ occupancyPercent() }}% capacity).</p>
            </div>
            <div class="occupancy-bar">
              <div class="occupancy-track">
                <div class="occupancy-fill" [style.width.%]="occupancyPercent()" [style.background]="occupancyPercent() >= 80 ? '#ef4444' : '#00D166'"></div>
              </div>
              <span class="occupancy-label">{{ occupancyPercent() }}%</span>
            </div>
            <div class="venue-chips">
              <span class="status-chip" [class.highlight]="occupancyPercent() >= 80" [class.chip-success]="occupancyPercent() < 80">
                {{ occupancyPercent() >= 80 ? 'NEAR CAPACITY' : 'ROOM AVAILABLE' }}
              </span>
              <span class="status-chip" *ngIf="openTabs() > 0">{{ openTabs() }} open tab{{ openTabs() !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <div class="revenue-card">
          <div class="revenue-icon-header">
            <mat-icon class="rev-icon">payments</mat-icon>
            <h3>Today's Revenue</h3>
          </div>
          <div class="revenue-amount">₦{{ (dailyRevenue() / 100).toLocaleString() }}</div>
          <p>From {{ todayTabsCount() }} completed tab{{ todayTabsCount() !== 1 ? 's' : '' }}</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 32px 40px;
      background: var(--surface);
      min-height: 100%;
    }

    .breadcrumb {
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
      color: var(--on-surface-muted); font-size: 0.8125rem; font-weight: 500;
      .current { color: var(--on-surface); font-weight: 600; }
      .separator { font-size: 16px; width: 16px; height: 16px; }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--on-surface);
      margin: 0;
      line-height: 1.1;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--on-surface-muted);
      margin: 8px 0 0;
    }

    .btn-action {
      background: var(--primary); color: white; border: none;
      padding: 12px 24px; border-radius: 12px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      transition: transform 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px var(--primary-glow); }
      &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      color: #b91c1c;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 0.875rem;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 24px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 32px rgba(11, 28, 48, 0.03);
    }

    .icon-wrap {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }

    .card-info {
      .label {
        font-size: 0.8125rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.05em; color: var(--on-surface-muted); margin-bottom: 4px;
      }
      .value {
        font-size: 1.75rem; font-weight: 700; color: var(--on-surface);
      }
    }

    .section-card {
      background: white;
      border-radius: 24px;
      padding: 32px 28px;
      box-shadow: 0 8px 32px rgba(11, 28, 48, 0.03);
      margin-bottom: 24px;
    }

    .section-header {
      margin-bottom: 24px;
      h2 { font-size: 1.25rem; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
      p { font-size: 0.875rem; color: var(--on-surface-muted); margin: 0; }
    }

    .chart-wrapper {
      width: 100%;
      box-sizing: border-box;
      canvas { display: block; width: 100% !important; height: auto !important; }
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
      .section-card { margin-bottom: 0; }
    }

    .waiter-list {
      .waiter-row {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 0; border-bottom: 1px solid var(--surface-container);
        &:last-child { border-bottom: none; }
      }
      .waiter-empty {
        text-align: center; padding: 24px; color: var(--on-surface-muted);
        mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
        p { margin: 0; font-size: 0.875rem; }
      }
    }

    .waiter-avatar {
      width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .waiter-info {
      flex: 1; display: flex; flex-direction: column;
      .waiter-name { font-weight: 600; color: var(--on-surface); font-size: 0.9375rem; }
      .waiter-meta { font-size: 0.8125rem; color: var(--on-surface-muted); }
    }

    .waiter-revenue {
      .amount { font-weight: 700; color: var(--on-surface); font-size: 0.9375rem; }
    }

    .transactions-list {
      .transaction-row {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 0; border-bottom: 1px solid var(--surface-container);
        &:last-child { border-bottom: none; }
      }
      .txn-empty {
        text-align: center; padding: 24px; color: var(--on-surface-muted);
        mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
        p { margin: 0; font-size: 0.875rem; }
      }
    }

    .txn-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #fff3e0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .txn-details {
      flex: 1; display: flex; flex-direction: column;
      .txn-title { font-weight: 600; color: var(--on-surface); font-size: 0.9375rem; }
      .txn-meta { font-size: 0.8125rem; color: var(--on-surface-muted); }
    }

    .txn-amount {
      .amount { font-weight: 700; color: var(--on-surface); font-size: 0.9375rem; }
    }

    .view-all-row {
      margin-top: 12px; text-align: right;
      a { color: var(--primary); text-decoration: none; font-weight: 600; font-size: 0.875rem; }
    }

    .ops-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .venue-status-card {
      background: white; border-radius: 24px; padding: 32px 28px;
      display: flex; align-items: flex-start; gap: 24px;
      box-shadow: 0 8px 32px rgba(11, 28, 48, 0.03);
    }

    .venue-status-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--surface-container); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }

    .venue-info { flex: 1; }
    .venue-header {
      margin-bottom: 16px;
      h3 { font-size: 1.125rem; font-weight: 700; margin: 0 0 4px; color: var(--on-surface); }
      p { font-size: 0.875rem; color: var(--on-surface-muted); margin: 0; }
    }

    .occupancy-bar {
      display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    }
    .occupancy-track {
      flex: 1; height: 10px; background: var(--surface-container); border-radius: 99px; overflow: hidden;
    }
    .occupancy-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
    .occupancy-label { font-size: 0.8125rem; font-weight: 700; color: var(--on-surface-muted); min-width: 36px; }

    .venue-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-chip {
      font-size: 0.6875rem; font-weight: 700; padding: 4px 12px;
      border-radius: 99px; letter-spacing: 0.05em;
      background: var(--surface-container); color: var(--on-surface-muted);
      &.highlight { background: #fef2f2; color: #ef4444; }
      &.chip-success { background: #e8f5e9; color: #2e7d32; }
    }

    .revenue-card {
      background: var(--primary); border-radius: 24px; padding: 32px 28px;
      display: flex; flex-direction: column; justify-content: center;
      h3 { color: white; font-size: 1rem; font-weight: 600; margin: 0; }
      p { color: rgba(255,255,255,0.7); font-size: 0.875rem; margin: 4px 0 0; }
    }
    .revenue-icon-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .rev-icon { color: white; }
    .revenue-amount {
      font-size: 2.25rem; font-weight: 800; color: white;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, var(--surface-container) 25%, #e8ecf0 50%, var(--surface-container) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private branchService = inject(BranchesApiService);
  private reportsService = inject(ReportsApiService);

  @ViewChild('peakHoursCanvas') peakHoursCanvas!: ElementRef<HTMLCanvasElement>;

  isLoading = signal(true);
  peakHours = signal<PeakHoursEntry[]>([]);
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
  private chartInstance?: Chart;

  ngOnInit() {
    this.loadStats();
    this.loadPeakHours();
    this.pollingSub = interval(30000).subscribe(() => {
      this.loadStats();
      this.loadPeakHours();
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
    this.chartInstance?.destroy();
  }

  private getBranchId(): string {
    return localStorage.getItem('branchId') || '';
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

  loadPeakHours() {
    const branchId = this.getBranchId();
    if (!branchId) return;
    this.reportsService.getPeakHours(branchId).subscribe({
      next: (entries) => {
        this.peakHours.set(entries || []);
        this.updateChart();
      },
      error: () => {}
    });
  }

  private initChart() {
    if (!this.peakHoursCanvas?.nativeElement) return;
    const ctx = this.peakHoursCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Orders',
          data: [],
          backgroundColor: '#0059bb',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0b1c30',
            titleFont: { family: 'Inter' },
            bodyFont: { family: 'Inter' },
            cornerRadius: 8,
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b', stepSize: 1 },
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chartInstance) return;
    const data = this.peakHours();
    const labels = data.map(e => {
      const h = e.hour;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}${ampm}`;
    });
    const values = data.map(e => e.orderCount);
    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = values;
    this.chartInstance.update('none');
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

  waiterPerformance = computed(() => (this.stats().waiterPerformance || []).slice(0, 5));
  recentOrders = computed(() => (this.stats().recentOrders || []).slice(0, 5));
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
