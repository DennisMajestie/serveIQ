import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportsApiService, BranchesApiService } from '@serveiq/shared/data-access';
import { DashboardStats, SalesEntry, TopItemEntry, PeakHoursEntry } from '@serveiq/shared/models';
import { CurrencyContextService } from '../core/currency-context.service';

interface AnalyticsMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

interface StaffPerformance {
  name: string;
  role: string;
  sales: number;
  efficiency: number;
  avatar: string;
}

interface PeakHoursData {
  hour: number;
  orderCount: number;
  revenueKobo: number;
}

interface CategoryROI {
  name: string;
  value: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private branchesApi = inject(BranchesApiService);
  private currency = inject(CurrencyContextService);

  kpiMetrics = signal<AnalyticsMetric[]>([]);
  categoryROI = signal<CategoryROI[]>([]);
  staffData = signal<StaffPerformance[]>([]);
  peakHoursData = signal<PeakHoursData[]>([]);

  chartPaths = computed(() => {
    const data = this.peakHoursData();
    if (!data.length) return { line: '', area: '', line2: '', area2: '' };

    const maxKobo = Math.max(...data.map(d => d.revenueKobo), 1);
    const maxOrders = Math.max(...data.map(d => d.orderCount), 1);
    const margin = 50;
    const chartW = 900;
    const chartH = 240;
    const bottom = 280;
    const step = data.length > 1 ? chartW / (data.length - 1) : chartW;

    const pts = data.map((d, i) => ({
      x: margin + i * step,
      y: bottom - (d.revenueKobo / maxKobo) * chartH
    }));

    const lineSeg = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const area = lineSeg + ` L ${pts[pts.length - 1].x},${bottom} L ${margin},${bottom} Z`;

    const pts2 = data.map((d, i) => ({
      x: margin + i * step,
      y: bottom - (d.orderCount / maxOrders) * chartH
    }));

    const lineSeg2 = pts2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const area2 = lineSeg2 + ` L ${pts2[pts2.length - 1].x},${bottom} L ${margin},${bottom} Z`;

    return { line: lineSeg, area, line2: lineSeg2, area2 };
  });

  isLoading = signal(true);
  isUsingMockData = signal(false);
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

    forkJoin({
      stats: this.branchesApi.getStats().pipe(catchError(() => of(null))),
      sales: this.reportsApi.getSales(df, dt).pipe(catchError(() => of([] as SalesEntry[]))),
      topItems: this.reportsApi.getTopItems(df, dt).pipe(catchError(() => of([] as TopItemEntry[]))),
      peakHours: this.reportsApi.getPeakHours(undefined, df, dt).pipe(catchError(() => of([] as PeakHoursEntry[]))),
    }).subscribe(({ stats, sales, topItems, peakHours }) => {
      this.peakHoursData.set(peakHours);

      if (stats) {
        this.updateKPIMetrics(stats, sales);
        this.updateStaffData(stats.waiterPerformance);
      } else if (sales.length) {
        this.updateKPIMetricsFromSales(sales);
      } else {
        this.isUsingMockData.set(true);
        this.setMockData();
      }

      this.updateCategoryROI(topItems);
      this.isLoading.set(false);
    });
  }

  updateKPIMetrics(stats: DashboardStats, sales: SalesEntry[]) {
    const totalKobo = sales.reduce((s, e) => s + e.revenueKobo, 0);
    const totalOrders = sales.reduce((s, e) => s + e.orderCount, 0);
    const avgTicket = totalOrders > 0 ? totalKobo / totalOrders : 0;

    this.kpiMetrics.set([
      { label: 'Total Revenue', value: this.formatKobo(totalKobo), change: '—', trend: 'neutral', icon: 'payments', color: '#00D166' },
      { label: 'Avg Ticket', value: this.formatKobo(avgTicket), change: '—', trend: 'neutral', icon: 'receipt', color: '#0059bb' },
      { label: 'Active Tabs', value: stats.openTabs.toString(), change: '—', trend: 'neutral', icon: 'table_restaurant', color: '#8b5cf6' },
      { label: 'Tables Occupied', value: stats.activeTables.toString(), change: '—', trend: 'neutral', icon: 'person', color: '#FF7043' },
    ]);
  }

  updateKPIMetricsFromSales(sales: SalesEntry[]) {
    const totalKobo = sales.reduce((s, e) => s + e.revenueKobo, 0);
    const totalOrders = sales.reduce((s, e) => s + e.orderCount, 0);
    const avgTicket = totalOrders > 0 ? totalKobo / totalOrders : 0;

    this.kpiMetrics.set([
      { label: 'Total Revenue', value: this.formatKobo(totalKobo), change: '—', trend: 'neutral', icon: 'payments', color: '#00D166' },
      { label: 'Avg Ticket', value: this.formatKobo(avgTicket), change: '—', trend: 'neutral', icon: 'receipt', color: '#0059bb' },
      { label: 'Active Tabs', value: '—', change: '—', trend: 'neutral', icon: 'table_restaurant', color: '#8b5cf6' },
      { label: 'Tables Occupied', value: '—', change: '—', trend: 'neutral', icon: 'person', color: '#FF7043' },
    ]);
  }

  updateStaffData(waiterPerformance: any[]) {
    this.staffData.set(waiterPerformance.map(w => ({
      name: w.waiter?.fullName || 'Unknown Waiter',
      role: 'Staff',
      sales: w.tabsCount || 0,
      efficiency: Math.min(Math.round((w.revenueKobo / (w.tabsCount * 500000)) * 100), 100) || 0,
      avatar: w.waiter?.avatarUrl || '#9d4300'
    })));
  }

  updateCategoryROI(items: TopItemEntry[]) {
    if (!items.length) {
      this.categoryROI.set([]);
      return;
    }

    const totalKobo = items.reduce((s, i) => s + i.revenueKobo, 0) || 1;
    const sorted = [...items].sort((a, b) => b.revenueKobo - a.revenueKobo).slice(0, 3);
    const colors = ['#00D166', '#0059bb', '#FF7043'];

    this.categoryROI.set(sorted.map((item, i) => ({
      name: item.name,
      value: Math.round(item.revenueKobo / 100).toLocaleString(),
      percentage: Math.round((item.revenueKobo / totalKobo) * 100),
      color: colors[i] || '#00D166',
    })));
  }

  setMockData() {
    this.kpiMetrics.set([
      { label: 'Total Revenue', value: '₦4,840k', change: '+12.4%', trend: 'up', icon: 'payments', color: '#00D166' },
      { label: 'Avg Ticket', value: '₦8,450', change: '+5.2%', trend: 'up', icon: 'receipt', color: '#0059bb' },
      { label: 'Turnover Rate', value: '42m', change: '-4m', trend: 'up', icon: 'speed', color: '#8b5cf6' },
      { label: 'Cancel Rate', value: '1.2%', change: '+0.4%', trend: 'down', icon: 'cancel', color: '#FF7043' }
    ]);

    this.categoryROI.set([
      { name: 'Food & Entrees', value: '3,240,500', percentage: 65, color: '#00D166' },
      { name: 'Beverages', value: '1,120,000', percentage: 22, color: '#0059bb' },
      { name: 'Desserts', value: '479,500', percentage: 13, color: '#FF7043' }
    ]);

    this.staffData.set([
      { name: 'Sarah Miller', role: 'Main Section', sales: 452, efficiency: 94, avatar: '#00D166' },
      { name: 'Marcus Chen', role: 'Patio', sales: 398, efficiency: 88, avatar: '#0059bb' },
      { name: 'Elena Rodriguez', role: 'Bar', sales: 312, efficiency: 91, avatar: '#8b5cf6' }
    ]);
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  getHoursForChart(hour: number): string {
    const hours = ['12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
    return hours[hour] || '';
  }

  getMaxOrders(): number {
    if (!this.peakHoursData().length) return 0;
    return Math.max(...this.peakHoursData().map(d => d.orderCount));
  }

  onDateChange() {
    this.loadAll();
  }

  exportReport() {
    const rows = this.peakHoursData().map(d =>
      `${d.hour}:00,${d.orderCount},${(d.revenueKobo / 100).toFixed(2)}`
    ).join('\n');
    const csv = `Hour,Orders,Revenue (NGN)\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${this.dateFrom()}_to_${this.dateTo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}