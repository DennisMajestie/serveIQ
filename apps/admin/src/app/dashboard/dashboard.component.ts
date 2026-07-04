import { Component, signal, computed, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BranchesApiService, ReportsApiService, DashboardStats } from '@serveiq/shared/data-access';
import { PeakHoursEntry } from '@serveiq/shared/models';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private branchService = inject(BranchesApiService);
  private reportsService = inject(ReportsApiService);

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
  private chartCanvas?: HTMLCanvasElement;

  ngOnInit() {
    this.loadStats();
    this.loadPeakHours();
    this.pollingSub = interval(30000).subscribe(() => {
      this.loadStats();
      this.loadPeakHours();
    });
  }

  ngAfterViewInit() {
    this.initSparkline();
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
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
        this.updateSparkline();
      },
      error: () => {}
    });
  }

  private initSparkline() {
    const canvas = document.getElementById('revenue-sparkline') as HTMLCanvasElement;
    if (!canvas) return;
    this.chartCanvas = canvas;
    this.updateSparkline();
  }

  private updateSparkline() {
    const canvas = this.chartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.peakHours();
    const values = data.length > 0 ? data.map(e => e.orderCount) : [8, 10, 12, 16, 14, 9, 11];
    const max = Math.max(...values, 1);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barCount = values.length;
    const gap = 2;
    const barWidth = (w - gap * (barCount - 1)) / barCount;

    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0.8)');

    values.forEach((v, i) => {
      const barH = (v / max) * (h - 4);
      const x = i * (barWidth + gap);
      const y = h - barH;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [2, 2, 0, 0]);
      ctx.fill();
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

  waiterPerformance = computed(() => (this.stats().waiterPerformance || []).slice(0, 5));
  recentOrders = computed(() => (this.stats().recentOrders || []));
  activeTables = computed(() => this.stats().activeTables);
  totalTables = computed(() => this.stats().totalTables);
  openTabs = computed(() => this.stats().openTabs);
  dailyRevenue = computed(() => this.stats().dailyRevenue);
  todayTabsCount = computed(() => this.stats().todayTabsCount);
  revenueDisplay = computed(() => `₦${(this.stats().realTimeSales / 100).toLocaleString()}`);
  staffCount = computed(() => (this.stats().waiterPerformance || []).length);
  staffOnDuty = computed(() => this.staffCount());
  tableVelocity = computed(() => {
    const orders = this.recentOrders();
    if (orders.length === 0) return '—';
    const avg = orders.reduce((s, o) => s + (o.quantity || 1), 0) / orders.length;
    const minutes = Math.round(avg * 8 + 20);
    return `${minutes}m`;
  });
  occupancyPercent = computed(() => {
    const total = this.totalTables();
    if (total === 0) return 0;
    return Math.round((this.activeTables() / total) * 100);
  });

  maxPeakValue = computed(() => {
    const entries = this.peakHours();
    if (entries.length === 0) return 1;
    return Math.max(...entries.map(e => e.orderCount), 1);
  });

  formatHour(hour: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}${ampm}`;
  }
}
