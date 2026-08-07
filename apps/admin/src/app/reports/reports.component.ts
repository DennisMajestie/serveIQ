import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsApiService, BranchesApiService } from '@serveiq/shared/data-access';
import { SalesEntry, TopItemEntry, PeakHoursEntry, TableVelocityEntry, PeakEfficiencyEntry, Branch, DashboardStats } from '@serveiq/shared/models';
import { CurrencyContextService } from '../core/currency-context.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
<div class="page-header">
      <h1>Reports</h1>
      <div class="filters">
        <div class="date-filter">
          <input type="date" [(ngModel)]="dateFrom" (change)="loadActiveTab()">
          <input type="date" [(ngModel)]="dateTo" (change)="loadActiveTab()">
        </div>
        <div class="branch-filter" *ngIf="branches().length > 1">
          <label>Branch:</label>
          <select [(ngModel)]="selectedBranchId" (change)="onBranchChange()">
            <option value="all">All Branches (Aggregated)</option>
            <option *ngFor="let b of branches()" [value]="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>
    </div>

      <div class="tabs">
        <button class="tab" *ngFor="let tab of tabs" [class.active]="activeTab() === tab.key" (click)="switchTab(tab.key)">
          <span class="material-symbols-outlined">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content" [class.loading]="loading()">
        <!-- Sales -->
        <ng-container *ngIf="activeTab() === 'sales'">
          <div class="summary-cards">
            <div class="summary-card">
              <span class="label">Total Revenue</span>
              <span class="value">{{ formatKobo(totalRevenueKobo()) }}</span>
            </div>
            <div class="summary-card">
              <span class="label">Total Orders</span>
              <span class="value">{{ totalOrders() }}</span>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
<tbody>
                <tr *ngFor="let entry of salesData()">
                  <td>{{ entry.date | date:'mediumDate' }}</td>
                  <td>{{ formatKobo(entry.revenueKobo) }}</td>
                  <td>{{ entry.orderCount }}</td>
                  <td>{{ entry.paymentMethod }}</td>
        </tr>
        <tr *ngIf="salesData().length === 0">
          <td colspan="4" class="empty-state">No sales data for this period</td>
        </tr>
      </tbody>
            </table>
          </div>
        </ng-container>

        <!-- Peak Hours -->
        <ng-container *ngIf="activeTab() === 'peak-hours'">
          <div class="chart-area">
            <div class="bar-chart">
              <div class="bar-item" *ngFor="let entry of peakHoursData()">
                <div class="bar-label">{{ entry.hour }}:00</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="(entry.orderCount / maxPeakCount()) * 100"></div>
                </div>
                <div class="bar-value">{{ entry.orderCount }} orders</div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Top Items -->
        <ng-container *ngIf="activeTab() === 'top-items'">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
<tbody>
        <tr *ngFor="let item of topItemsData(); let i = index">
          <td>{{ i + 1 }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.category }}</td>
          <td>{{ item.quantitySold }}</td>
          <td>{{ formatKobo(item.revenueKobo) }}</td>
        </tr>
        <tr *ngIf="topItemsData().length === 0">
          <td colspan="5" class="empty-state">No items sold in this period</td>
        </tr>
      </tbody>
            </table>
          </div>
        </ng-container>

        <!-- Table Velocity -->
        <ng-container *ngIf="activeTab() === 'table-velocity'">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Avg Turnover</th>
                  <th>Total Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of velocityData()">
                  <td>{{ entry.tableNumber || 'Table ' + entry.tableId.slice(0, 8) }}</td>
                  <td>{{ entry.avgDurationMinutes }} min</td>
                  <td>{{ entry.totalCovers }}</td>
                  <td>—</td>
                </tr>
                <tr *ngIf="velocityData().length === 0">
                  <td colspan="4" class="empty-state">No velocity data available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>

        <!-- Peak Efficiency -->
        <ng-container *ngIf="activeTab() === 'peak-efficiency'">
          <div class="summary-cards">
            <div class="summary-card" *ngFor="let entry of efficiencyData()">
              <span class="label">{{ entry.hour }}:00</span>
              <span class="value">{{ entry.totalCovers }}</span>
              <span class="sub">Covers (avg {{ entry.avgDurationMinutes }} min)</span>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .reports-page { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 700; color: var(--on-surface); }
    .filters { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .date-filter { display: flex; gap: 12px; }
    .date-filter input { padding: 8px 12px; border: 1px solid var(--outline-variant); border-radius: 8px; background: var(--surface); color: var(--on-surface); font-family: 'Inter', sans-serif; }
    .branch-filter { display: flex; align-items: center; gap: 8px; }
    .branch-filter label { font-size: 14px; font-weight: 500; color: var(--secondary); }
    .branch-filter select { padding: 8px 12px; border: 1px solid var(--outline-variant); border-radius: 8px; background: var(--surface); color: var(--on-surface); font-family: 'Inter', sans-serif; min-width: 220px; }

    .tabs { display: flex; gap: 4px; margin-bottom: 24px; background: var(--surface-container-low); border-radius: 12px; padding: 4px; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; background: transparent; color: var(--secondary); font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
    .tab:hover { color: var(--primary); background: var(--surface-container); }
    .tab.active { background: var(--surface); color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .tab .material-symbols-outlined { font-size: 18px; }

    .tab-content { transition: opacity 0.2s; }
    .tab-content.loading { opacity: 0.5; pointer-events: none; }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .summary-card .label { font-size: 13px; color: var(--secondary); font-weight: 500; }
    .summary-card .value { font-size: 28px; font-weight: 700; color: var(--on-surface); }
    .summary-card .sub { font-size: 12px; color: var(--on-surface-variant); }

    .table-wrapper { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--secondary); background: var(--surface-container-low); border-bottom: 1px solid var(--outline-variant); }
    td { padding: 14px 16px; font-size: 14px; color: var(--on-surface); border-bottom: 1px solid var(--outline-variant); }
    tr:last-child td { border-bottom: none; }
    .empty-state { text-align: center; color: var(--on-surface-variant); padding: 40px 16px; }

    .chart-area { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 24px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
    .bar-track { flex: 1; width: 100%; background: var(--surface-container-low); border-radius: 4px; position: relative; display: flex; align-items: flex-end; }
    .bar-fill { width: 100%; background: var(--primary); border-radius: 4px; min-height: 4px; transition: height 0.3s ease; }
    .bar-label { font-size: 11px; color: var(--secondary); font-weight: 600; }
    .bar-value { font-size: 11px; color: var(--on-surface-variant); }
  `]
})
export class ReportsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private branchesApi = inject(BranchesApiService);
  private currency = inject(CurrencyContextService);

  dateFrom = signal('');
  dateTo = signal('');
  loading = signal(false);
  activeTab = signal('sales');
  selectedBranchId = signal('all'); // 'all' = aggregate across all branches

  branches = signal<Branch[]>([]);
  salesData = signal<SalesEntry[]>([]);
  peakHoursData = signal<PeakHoursEntry[]>([]);
  topItemsData = signal<TopItemEntry[]>([]);
  velocityData = signal<TableVelocityEntry[]>([]);
  efficiencyData = signal<PeakEfficiencyEntry[]>([]);

  totalRevenue = computed(() => this.salesData().reduce((sum, e) => sum + e.revenueKobo, 0));
  totalRevenueKobo = computed(() => this.salesData().reduce((sum, e) => sum + e.revenueKobo, 0));
  totalOrders = computed(() => this.salesData().reduce((sum, e) => sum + e.orderCount, 0));
  maxPeakCount = computed(() => Math.max(...this.peakHoursData().map(e => e.orderCount), 1));

  currencyCode = computed(() => this.currency.getCode());
  currencySymbol = computed(() => this.currency.getSymbol());

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  tabs = [
    { key: 'sales', label: 'Sales', icon: 'payments' },
    { key: 'peak-hours', label: 'Peak Hours', icon: 'schedule' },
    { key: 'top-items', label: 'Top Items', icon: 'star' },
    { key: 'table-velocity', label: 'Table Velocity', icon: 'speed' },
    { key: 'peak-efficiency', label: 'Peak Efficiency', icon: 'trending_up' },
  ];

  ngOnInit() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.dateFrom.set(start.toISOString().split('T')[0]);
    this.dateTo.set(end.toISOString().split('T')[0]);
    this.loadBranches();
    this.loadActiveTab();
  }

  loadBranches() {
    this.branchesApi.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => this.branches.set([])
    });
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    this.loadActiveTab();
  }

  onBranchChange() {
    this.loadActiveTab();
  }

  loadActiveTab() {
    const df = this.dateFrom() || undefined;
    const dt = this.dateTo() || undefined;
    const tab = this.activeTab();
    const branchId = this.selectedBranchId() === 'all' ? undefined : this.selectedBranchId();
    this.loading.set(true);

    switch (tab) {
      case 'sales':
        this.reportsApi.getSales(df, dt).subscribe({
          next: data => { this.salesData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'peak-hours':
        this.reportsApi.getPeakHours(branchId, df, dt).subscribe({
          next: data => { this.peakHoursData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'top-items':
        this.reportsApi.getTopItems(df, dt).subscribe({
          next: data => { this.topItemsData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'table-velocity':
        this.reportsApi.getTableVelocity(branchId, df, dt).subscribe({
          next: data => { this.velocityData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'peak-efficiency':
        this.reportsApi.getPeakEfficiency(df, dt).subscribe({
          next: data => { this.efficiencyData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
    }
  }
}
