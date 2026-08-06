import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportsApiService, BranchesApiService } from '@serveiq/shared/data-access';
import { DashboardStats, SalesEntry, PeakHoursEntry, Branch, BranchKPI } from '@serveiq/shared/models';
import { CurrencyContextService } from '../core/currency-context.service';

interface ComparisonMetric {
  label: string;
  branches: { branchId: string; branchName: string; value: number; formatted: string; rank: number }[];
  unit: 'currency' | 'number' | 'minutes' | 'percent';
}

@Component({
  selector: 'app-branch-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule],
  templateUrl: './branch-analytics.component.html',
  styleUrls: ['./branch-analytics.component.scss']
})
export class BranchAnalyticsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private branchesApi = inject(BranchesApiService);
  private currency = inject(CurrencyContextService);

  branches = signal<Branch[]>([]);
  branchKPIs = signal<BranchKPI[]>([]);
  comparisonMetrics = signal<ComparisonMetric[]>([]);
  revenueTrends = signal<{ date: string; branches: { branchId: string; revenue: number }[] }[]>([]);

  isLoading = signal(true);
  dateFrom = signal('');
  dateTo = signal('');
  selectedRange = signal<string>('monthly');

  readonly ranges = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: '6months', label: '6 Months' },
    { key: 'annual', label: 'Annual' },
  ];

  ngOnInit() {
    this.setRange('monthly');
  }

  setRange(key: string) {
    this.selectedRange.set(key);
    const now = new Date();
    const from = new Date();
    switch (key) {
      case 'daily': break;
      case 'weekly': from.setDate(now.getDate() - 7); break;
      case 'monthly': from.setDate(now.getDate() - 30); break;
      case 'quarterly': from.setDate(now.getDate() - 90); break;
      case '6months': from.setDate(now.getDate() - 180); break;
      case 'annual': from.setDate(now.getDate() - 365); break;
    }
    this.dateFrom.set(from.toISOString().split('T')[0]);
    this.dateTo.set(now.toISOString().split('T')[0]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    const df = this.dateFrom() || undefined;
    const dt = this.dateTo() || undefined;

    this.branchesApi.list().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.loadBranchData(branches, df, dt);
      },
      error: () => {
        this.branches.set([]);
        this.isLoading.set(false);
      }
    });
  }

  private loadBranchData(branches: Branch[], df: string | undefined, dt: string | undefined) {
    if (branches.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const branchCalls = branches.map(branch => 
      forkJoin({
        stats: this.branchesApi.getStats().pipe(catchError(() => of(null))),
        sales: this.reportsApi.getSales(df, dt).pipe(catchError(() => of([] as SalesEntry[]))),
        peakHours: this.reportsApi.getPeakHours(branch.id, df, dt).pipe(catchError(() => of([] as PeakHoursEntry[]))),
        velocity: this.reportsApi.getTableVelocity(branch.id, df, dt).pipe(catchError(() => of([]))),
      }).pipe(
        map(({ stats, sales, peakHours, velocity }) => ({ branch, stats, sales, peakHours, velocity }))
      )
    );

    forkJoin(branchCalls).subscribe(results => {
      const kpis: BranchKPI[] = results.map(r => this.calculateBranchKPI(r.branch, r.stats, r.sales, r.peakHours, r.velocity));
      
      kpis.sort((a, b) => b.totalRevenue - a.totalRevenue);
      kpis.forEach((kpi, idx) => kpi.rank = idx + 1);

      this.branchKPIs.set(kpis);
      this.buildComparisonMetrics(kpis);
      this.buildRevenueTrends(results, df, dt);
      this.isLoading.set(false);
    });
  }

  private calculateBranchKPI(
    branch: Branch,
    stats: DashboardStats | null,
    sales: SalesEntry[],
    peakHours: PeakHoursEntry[],
    velocity: any[]
  ): BranchKPI {
    const totalRevenue = sales.reduce((s, e) => s + e.revenueKobo, 0);
    const totalOrders = sales.reduce((s, e) => s + e.orderCount, 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const tableVelocity = velocity.length > 0 
      ? Math.round(velocity.reduce((s, v) => s + v.avgDurationMinutes, 0) / velocity.length)
      : 0;

    const prevRevenue = this.getPreviousPeriodRevenue(sales);
    const trend = totalRevenue > prevRevenue ? 'up' : totalRevenue < prevRevenue ? 'down' : 'neutral';
    const trendValue = prevRevenue > 0 
      ? `${trend === 'up' ? '+' : ''}${Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)}%`
      : '—';

    return {
      branchId: branch.id,
      branchName: branch.name,
      totalRevenue,
      totalOrders,
      avgTicket,
      activeTables: stats?.activeTables || 0,
      openTabs: stats?.openTabs || 0,
      tableVelocity,
      trend,
      trendValue,
      rank: 0
    };
  }

  private getPreviousPeriodRevenue(sales: SalesEntry[]): number {
    return 0;
  }

  private buildComparisonMetrics(kpis: BranchKPI[]) {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Total Revenue',
        unit: 'currency',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.totalRevenue,
          formatted: this.formatKobo(k.totalRevenue),
          rank: i + 1
        }))
      },
      {
        label: 'Total Orders',
        unit: 'number',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.totalOrders,
          formatted: k.totalOrders.toLocaleString(),
          rank: i + 1
        }))
      },
      {
        label: 'Avg Ticket',
        unit: 'currency',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.avgTicket,
          formatted: this.formatKobo(k.avgTicket),
          rank: i + 1
        }))
      },
      {
        label: 'Table Turnover',
        unit: 'minutes',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.tableVelocity,
          formatted: `${k.tableVelocity} min`,
          rank: i + 1
        }))
      },
      {
        label: 'Active Tables',
        unit: 'number',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.activeTables,
          formatted: k.activeTables.toString(),
          rank: i + 1
        }))
      },
      {
        label: 'Open Tabs',
        unit: 'number',
        branches: kpis.map((k, i) => ({
          branchId: k.branchId,
          branchName: k.branchName,
          value: k.openTabs,
          formatted: k.openTabs.toString(),
          rank: i + 1
        }))
      }
    ];

    this.comparisonMetrics.set(metrics);
  }

  private buildRevenueTrends(results: any[], df: string | undefined, dt: string | undefined) {
    const allDates = new Set<string>();
    results.forEach(r => {
      r.sales.forEach((s: SalesEntry) => allDates.add(s.date));
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    const trends = sortedDates.map(date => ({
      date,
      branches: results.map(r => ({
        branchId: r.branch.id,
        revenue: r.sales.find((s: SalesEntry) => s.date === date)?.revenueKobo || 0
      }))
    }));
    
    this.revenueTrends.set(trends);
  }

  // Chart configuration
  readonly chartWidth = 1000;
  readonly chartHeight = 300;
  readonly chartMargin = { top: 30, right: 30, bottom: 50, left: 60 };
  readonly branchColors = ['#00D166', '#0059bb', '#8b5cf6', '#FF7043', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

  // Computed properties for summary cards
  totalRevenueAll = computed(() => this.branchKPIs().reduce((sum, k) => sum + k.totalRevenue, 0));
  totalOrdersAll = computed(() => this.branchKPIs().reduce((sum, k) => sum + k.totalOrders, 0));
  weightedAvgTicket = computed(() => {
    const totalRev = this.totalRevenueAll();
    const totalOrd = this.totalOrdersAll();
    return totalOrd > 0 ? totalRev / totalOrd : 0;
  });
  revenueTrend = computed(() => {
    // Simplified: compare first half vs second half
    const kpis = this.branchKPIs();
    if (kpis.length === 0) return 'neutral';
    return kpis[0].trend;
  });
  revenueTrendValue = computed(() => {
    const kpis = this.branchKPIs();
    if (kpis.length === 0) return '—';
    return kpis[0].trendValue;
  });

  topBranch = computed(() => this.branchKPIs()[0] || null);
  bottomBranch = computed(() => {
    const kpis = this.branchKPIs();
    return kpis.length > 1 ? kpis[kpis.length - 1] : null;
  });
  fastestTurnover = computed(() => {
    const kpis = [...this.branchKPIs()].sort((a, b) => a.tableVelocity - b.tableVelocity);
    return kpis[0] || null;
  });
  highestAvgTicket = computed(() => {
    const kpis = [...this.branchKPIs()].sort((a, b) => b.avgTicket - a.avgTicket);
    return kpis[0] || null;
  });

  // Grid lines for chart
  gridLines = computed(() => {
    const lines = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      lines.push(this.chartMargin.top + (this.chartHeight - this.chartMargin.top - this.chartMargin.bottom) * i / steps);
    }
    return lines;
  });

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'remove';
    }
  }

  getTrendClass(trend: string): string {
    return `trend-${trend}`;
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  getBarWidth(metric: ComparisonMetric, branch: { value: number }): number {
    const values = metric.branches.map(b => b.value);
    const max = Math.max(...values, 1);
    return (branch.value / max) * 100;
  }

  // Chart path generation
  getTrendPath(branchId: string): string {
    const trends = this.revenueTrends();
    if (!trends.length) return '';

    const branchData = trends.map(t => {
      const b = t.branches.find(b => b.branchId === branchId);
      return b?.revenue || 0;
    });

    const maxRevenue = Math.max(...branchData, 1);
    const innerWidth = this.chartWidth - this.chartMargin.left - this.chartMargin.right;
    const innerHeight = this.chartHeight - this.chartMargin.top - this.chartMargin.bottom;
    const step = branchData.length > 1 ? innerWidth / (branchData.length - 1) : innerWidth;

    let path = '';
    branchData.forEach((revenue, i) => {
      const x = this.chartMargin.left + i * step;
      const y = this.chartMargin.top + innerHeight - (revenue / maxRevenue) * innerHeight;
      path += `${i === 0 ? 'M' : 'L'} ${x},${y} `;
    });

    return path.trim();
  }

  getTrendPoints(branchId: string): { x: number; y: number }[] {
    const trends = this.revenueTrends();
    if (!trends.length) return [];

    const branchData = trends.map(t => {
      const b = t.branches.find(b => b.branchId === branchId);
      return b?.revenue || 0;
    });

    const maxRevenue = Math.max(...branchData, 1);
    const innerWidth = this.chartWidth - this.chartMargin.left - this.chartMargin.right;
    const innerHeight = this.chartHeight - this.chartMargin.top - this.chartMargin.bottom;
    const step = branchData.length > 1 ? innerWidth / (branchData.length - 1) : innerWidth;

    return branchData.map((revenue, i) => ({
      x: this.chartMargin.left + i * step,
      y: this.chartMargin.top + innerHeight - (revenue / maxRevenue) * innerHeight
    }));
  }

  onDateChange() {
    this.loadAll();
  }

  exportComparison() {
    const headers = ['Branch', 'Revenue', 'Orders', 'Avg Ticket', 'Table Turnover (min)', 'Active Tables', 'Open Tabs'];
    const rows = this.branchKPIs().map(k => [
      k.branchName,
      this.formatKobo(k.totalRevenue),
      k.totalOrders.toLocaleString(),
      this.formatKobo(k.avgTicket),
      k.tableVelocity.toString(),
      k.activeTables.toString(),
      k.openTabs.toString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `branch-comparison-${this.dateFrom()}_to_${this.dateTo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}