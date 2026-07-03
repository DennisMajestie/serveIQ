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
    <div class="dashboard-page">
      <!-- Header -->
      <div class="dashboard-header">
        <h2>Dashboard Stats</h2>
        <button class="refresh-btn" (click)="loadStats()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <div class="error-message" *ngIf="errorMessage()">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage() }}
      </div>

      <ng-container *ngIf="!isLoading(); else statsSkeleton">
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let kpi of kpiCards()">
            <div class="card-icon" [style.background]="kpi.iconBg + '15'">
              <mat-icon [style.color]="kpi.iconBg">{{ kpi.icon }}</mat-icon>
            </div>
            <div class="card-label">{{ kpi.label }}</div>
            <div class="card-value">{{ kpi.value }}</div>
            <span class="card-badge" *ngIf="kpi.subValue">{{ kpi.subValue }}</span>
          </div>
        </div>
      </ng-container>
      <ng-template #statsSkeleton>
        <div class="stats-grid">
          <div class="stat-card" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton-shimmer" style="width: 40px; height: 40px; border-radius: 10px; margin-bottom: 16px;"></div>
            <div class="skeleton-shimmer" style="width: 60%; height: 12px; margin-bottom: 8px;"></div>
            <div class="skeleton-shimmer" style="width: 80%; height: 28px;"></div>
          </div>
        </div>
      </ng-template>

      <!-- Peak Hours Chart -->
      <div class="peak-hours-section">
        <div class="peak-header">
          <h2>Peak Hours</h2>
          <p>Hourly order volume from completed tabs</p>
        </div>
        <div class="chart-wrapper">
          <canvas #peakHoursCanvas></canvas>
        </div>
      </div>

      <!-- Main Content Grid -->
      <section class="content-grid" aria-label="Dashboard content">
        <article class="content-card waiter-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Waiter Performance</h2>
              <p class="card-subtitle">Today's tabs and revenue per staff member</p>
            </div>
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
                <div class="skeleton-shimmer" style="width: 44px; height: 44px; border-radius: 50%;"></div>
                <div class="waiter-info">
                  <div class="skeleton-shimmer" style="width: 120px; height: 14px; margin-bottom: 4px;"></div>
                  <div class="skeleton-shimmer" style="width: 80px; height: 12px;"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </article>

        <article class="content-card transactions-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Recent Orders</h2>
              <p class="card-subtitle">Latest orders across all tabs</p>
            </div>
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
        <article class="venue-status-card">
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
        </article>

        <article class="revenue-card">
          <div class="revenue-icon-header">
            <mat-icon class="rev-icon">payments</mat-icon>
            <h3>Today's Revenue</h3>
          </div>
          <div class="revenue-amount">₦{{ (dailyRevenue() / 100).toLocaleString() }}</div>
          <p>From {{ todayTabsCount() }} completed tab{{ todayTabsCount() !== 1 ? 's' : '' }}</p>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 40px 48px;
      max-width: 1600px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
      color: #0b1c30;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;

      h2 {
        font-size: 18px;
        font-weight: 700;
        color: #18181b;
        margin: 0;
        line-height: 1;
      }
    }

    .refresh-btn { 
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      background: white;
      font-size: 13px;
      font-weight: 500;
      color: #52525b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .refresh-btn:hover:not(:disabled) { 
      background: #f4f4f5;
    }
    .refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .refresh-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .error-message {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 24px; color: #b91c1c;
    }
    .error-message mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid #f0f1f3;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);

      .card-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .card-label {
        font-size: 12px;
        font-weight: 600;
        color: #71717a;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 8px;
      }

      .card-value {
        font-size: 28px;
        font-weight: 700;
        color: #18181b;
      }

      .card-badge {
        float: right;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        background: #dcfce7;
        color: #16a34a;
      }
    }

    .peak-hours-section {
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid #f0f1f3;
      margin-bottom: 32px;

      .peak-header {
        h2 {
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 4px;
        }
        p {
          font-size: 13px;
          color: #71717a;
          margin: 0;
        }
      }

      .chart-wrapper {
        position: relative;
        height: 220px;
        margin-top: 16px;
        width: 100%;

        canvas {
          width: 100% !important;
        }
      }
    }

    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .content-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 20px 24px; border: 1px solid #f0f1f3; }
    .card-title { font-size: 18px; font-weight: 700; margin: 0; color: #18181b; }
    .card-subtitle { color: #71717a; font-size: 13px; margin: 4px 0 0; }

    .waiter-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .waiter-row { 
      display: flex; align-items: center; gap: 16px; padding: 12px; 
      background: #f8f9ff; border-radius: 12px;
    }
    .waiter-avatar img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .waiter-info { flex: 1; display: flex; flex-direction: column; }
    .waiter-name { font-size: 14px; font-weight: 600; color: #18181b; }
    .waiter-meta { font-size: 12px; color: #71717a; }
    .waiter-revenue { font-weight: 600; font-size: 14px; color: #18181b; }
    .waiter-empty { 
      display: flex; flex-direction: column; align-items: center; gap: 8px; 
      padding: 32px; color: #71717a; text-align: center;
    }
    .waiter-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .transactions-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .transaction-row { 
      display: flex; align-items: center; gap: 16px; padding: 12px; 
      background: #f8f9ff; border-radius: 12px;
    }
    .txn-avatar { 
      width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .txn-details { flex: 1; display: flex; flex-direction: column; }
    .txn-title { font-size: 14px; font-weight: 600; color: #18181b; }
    .txn-meta { font-size: 12px; color: #71717a; }
    .txn-amount { font-weight: 600; font-size: 14px; color: #18181b; }

    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .venue-status-card { 
      display: flex; gap: 24px; padding: 20px 24px; align-items: center; 
      background: #eef2ff; border-radius: 16px;
    }
    .venue-status-icon { flex-shrink: 0; }
    .venue-info { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .venue-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #18181b; }
    .venue-header p { margin: 4px 0 0; font-size: 13px; color: #71717a; line-height: 1.4; }
    .occupancy-bar { display: flex; align-items: center; gap: 12px; }
    .occupancy-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .occupancy-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .occupancy-label { font-size: 13px; font-weight: 600; color: #18181b; min-width: 36px; }
    .venue-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-chip { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 8px; background: white; color: #71717a; }
    .status-chip.highlight { background: #fee2e2; color: #b91c1c; }
    .status-chip.chip-success { background: #e8f5e9; color: #16a34a; }
    .txn-empty { 
      display: flex; flex-direction: column; align-items: center; gap: 8px; 
      padding: 32px; color: #71717a; text-align: center;
    }
    .txn-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .view-all-row {
      text-align: center;
      padding: 12px 0 4px;
      border-top: 1px solid #f0f1f3;
      margin-top: 8px;
    }
    .view-all-row a {
      font-size: 13px;
      font-weight: 600;
      color: #f97316;
      text-decoration: none;
    }
    .view-all-row a:hover { text-decoration: underline; }

    .revenue-card { 
      background: #fffcf0; padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; 
      border-radius: 16px; border: 1px solid #f0f1f3;
    }
    .revenue-icon-header { display: flex; align-items: center; gap: 12px; color: #854d0e; }
    .revenue-icon-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
    .rev-icon { font-size: 24px; }
    .revenue-amount { font-size: 28px; font-weight: 700; color: #854d0e; }
    .revenue-card p { font-size: 13px; color: #854d0e; line-height: 1.4; margin: 0; }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
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
