import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BranchesApiService, DashboardStats } from '@serveiq/shared/data-access';

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
        <!-- Hourly Peak Times Chart Card (2/3) -->
        <article class="content-card chart-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title space-font">Hourly Peak Times</h2>
              <p class="card-subtitle inter-font">Sales volume distribution across business hours</p>
            </div>
            <div class="card-filter">
              <div class="toggle-group">
                <button class="toggle-btn active inter-font">Today</button>
                <button class="toggle-btn inter-font">Yesterday</button>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <div class="bar-chart" *ngIf="!isLoading(); else chartSkeleton">
              <div class="bar-group" *ngFor="let bar of peakTimesData()">
                <div class="bar-wrapper">
                  <div class="bar-fill" [style.height.%]="bar.value" [class.highlight]="bar.highlight"></div>
                </div>
                <span class="bar-label inter-font">{{ bar.label }}</span>
              </div>
            </div>
            <ng-template #chartSkeleton>
              <div class="bar-chart">
                <div class="bar-group" *ngFor="let i of [1,2,3,4,5,6,7,8]">
                  <div class="skeleton-shimmer bar-wrapper" style="height: 100%; border-radius: 6px;"></div>
                </div>
              </div>
            </ng-template>
          </div>
        </article>

        <!-- Recent Transactions Card (1/3) -->
        <article class="content-card transactions-card">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title space-font">Recent Activity</h2>
              <p class="card-subtitle inter-font">Latest 5 orders</p>
            </div>
            <a class="view-all-link inter-font">View All</a>
          </div>
          <div class="transactions-list" *ngIf="!isLoading(); else txnSkeletons">
            <div class="transaction-row" *ngFor="let txn of recentTransactions()">
              <div class="txn-avatar">
                  <mat-icon [style.color]="txn.status === 'completed' ? '#ff9800' : '#94a3b8'">{{ txn.status === 'completed' ? 'restaurant' : 'history' }}</mat-icon>
              </div>
              <div class="txn-details">
                <span class="txn-title space-font">{{ txn.table }}</span>
                <span class="txn-meta inter-font">{{ txn.time }} ago • {{ txn.paymentMethod }}</span>
              </div>
              <div class="txn-amount">
                <span class="amount space-font">₦{{ txn.amount?.toLocaleString() || '0' }}</span>
              </div>
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
          <div class="venue-image-container">
            <img src="/assets/food/jollof.png" alt="Venue Status">
          </div>
          <div class="venue-info">
            <div class="venue-header">
              <h3 class="space-font">Main Dining Room Status</h3>
              <p class="inter-font">85% Capacity reached. Consider opening the patio section for upcoming reservations.</p>
            </div>
            <div class="venue-chips">
              <span class="status-chip highlight inter-font">ACTIVE PEAK</span>
              <span class="status-chip inter-font">PATIO OPEN</span>
            </div>
          </div>
        </article>

        <article class="content-card inventory-card">
          <div class="inventory-icon-header">
              <mat-icon class="inv-icon">flare</mat-icon>
              <h3 class="space-font">Inventory Alert</h3>
          </div>
          <p class="inter-font">Premium Ribeye and Sea Bass stock levels are below threshold (15% remaining).</p>
          <button class="reorder-btn inter-font">Reorder Now</button>
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

    .card-filter .toggle-group { display: flex; background: #eff4ff; border-radius: 8px; padding: 4px; }
    .toggle-btn { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--on-surface-muted); cursor: pointer; }
    .toggle-btn.active { background: white; color: var(--on-surface); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .chart-container { height: 280px; margin: 24px 0; display: flex; align-items: flex-end; }
    .bar-chart { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; height: 240px; padding: 0 10px; }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 12px; flex: 1; }
    .bar-wrapper { width: 32px; height: 180px; background: #eff4ff; border-radius: 6px; display: flex; align-items: flex-end; overflow: hidden; }
    .bar-fill { width: 100%; background: #bbdefb; border-radius: 4px; transition: height 0.3s ease; }
    .bar-fill.highlight { background: #8d4013; }
    .bar-label { font-size: 0.7rem; color: var(--on-surface-muted); }

    .transactions-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .transaction-row { 
      display: flex; align-items: center; gap: 16px; padding: 16px; 
      background: #eff4ff; border-radius: 16px; transition: transform 0.2s;
      &:hover { transform: scale(1.02); }
    }
    .txn-avatar { 
      width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      background: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .txn-details { flex: 1; display: flex; flex-direction: column; }
    .txn-title { font-size: 0.9375rem; font-weight: 700; color: var(--on-surface); }
    .txn-meta { font-size: 0.75rem; color: var(--on-surface-muted); }
    .txn-amount { font-weight: 700; font-size: 0.9375rem; }

    .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 0 40px 40px; }
    .venue-status-card { display: flex; gap: 24px; padding: 24px; align-items: center; background: #eef2ff; border: none; }
    .venue-image-container { width: 120px; height: 120px; border-radius: 16px; overflow: hidden; flex-shrink: 0; }
    .venue-image-container img { width: 100%; height: 100%; object-fit: cover; }
    .venue-info { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .venue-header h3 { margin: 0; font-size: 1.125rem; }
    .venue-header p { margin: 4px 0 0; font-size: 0.8125rem; color: var(--on-surface-muted); line-height: 1.4; }
    .venue-chips { display: flex; gap: 8px; }
    .status-chip { font-size: 0.7rem; font-weight: 700; padding: 4px 12px; border-radius: 8px; background: white; color: var(--on-surface-muted); }
    .status-chip.highlight { background: #fee2e2; color: #b91c1c; }

    .inventory-card { background: #fffcf0; padding: 24px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .inventory-icon-header { display: flex; align-items: center; gap: 12px; color: #854d0e; }
    .inventory-icon-header h3 { margin: 0; font-size: 1.125rem; }
    .inv-icon { font-size: 24px; }
    .inventory-card p { font-size: 0.8125rem; color: #854d0e; line-height: 1.4; margin: 0; }
    .reorder-btn { background: #8d4013; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; margin-top: 8px; }
  `]
})
export class DashboardComponent implements OnInit {
  private branchService = inject(BranchesApiService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({ totalBranches: 0, totalTables: 0, openTabs: 0, totalOrders: 0 });
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.branchService.getStats().subscribe({
      next: (s: DashboardStats) => { this.stats.set(s); this.isLoading.set(false); },
      error: (error: any) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Unauthorized. Please login again.');
        } else {
          this.errorMessage.set('Failed to load dashboard stats. Please try again.');
        }
      }
    });
  }
  
  kpiCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Branches', value: s.totalBranches?.toString() || '0', subValue: 'Locations', icon: 'store', iconBg: '#FF7043' },
      { label: 'Active Tabs', value: s.openTabs?.toString() || '0', subValue: 'Current', icon: 'table_bar', iconBg: '#0059bb' },
      { label: 'Total Tables', value: s.totalTables?.toString() || '0', subValue: 'Configured', icon: 'analytics', iconBg: '#8b5cf6' },
      { label: 'Total Orders', value: s.totalOrders?.toString() || '0', subValue: 'Today', icon: 'receipt', iconBg: '#00D166' }
    ];
  });

  peakTimesData = signal([
    { label: '12pm', value: 30, highlight: false },
    { label: '1pm', value: 45, highlight: false },
    { label: '2pm', value: 75, highlight: true },
    { label: '3pm', value: 85, highlight: true },
    { label: '4pm', value: 65, highlight: true },
    { label: '5pm', value: 45, highlight: false },
    { label: '6pm', value: 55, highlight: false },
    { label: '7pm', value: 40, highlight: false },
    { label: '8pm', value: 35, highlight: false },
    { label: '10pm', value: 25, highlight: false }
  ]);

  recentTransactions = signal([
    { id: '1', table: 'Table 12', amount: 45800, status: 'completed', time: '2m', paymentMethod: 'Card' },
    { id: '2', table: 'Table 7', amount: 28400, status: 'completed', time: '5m', paymentMethod: 'Cash' },
    { id: '3', table: 'Table 3', amount: 15600, status: 'pending', time: '8m', paymentMethod: 'Transfer' },
    { id: '4', table: 'Table 19', amount: 67200, status: 'completed', time: '12m', paymentMethod: 'Card' },
    { id: '5', table: 'Table 5', amount: 34100, status: 'completed', time: '18m', paymentMethod: 'Cash' }
  ]);
}
