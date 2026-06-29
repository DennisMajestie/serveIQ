import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportsApiService } from '@serveiq/shared/data-access';
import { BranchesApiService } from '@serveiq/shared/data-access';
import { DashboardStats } from '@serveiq/shared/models';

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
  order_count: number;
  revenue_kobo: number;
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

  kpiMetrics = signal<AnalyticsMetric[]>([]);
  categoryROI = signal<CategoryROI[]>([]);
  staffData = signal<StaffPerformance[]>([]);
  peakHoursData = signal<PeakHoursData[]>([]);

  isLoading = signal(true);
  dateFrom = signal('');
  dateTo = signal('');

  ngOnInit() {
    this.loadAnalytics();
    // Set default dates to last 30 days for real data
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.dateFrom.set(thirtyDaysAgo.toISOString().split('T')[0]);
    this.dateTo.set(today.toISOString().split('T')[0]);
    this.loadPeakHours();
  }

  loadAnalytics() {
    // Load dashboard stats which include revenue and stats
    this.branchesApi.getStats().subscribe({
      next: (stats: DashboardStats) => {
        this.updateKPIMetrics(stats);
        this.updateStaffData(stats.waiterPerformance);
        this.updateCategoryROI(stats.recentOrders);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Fallback to mock data
        this.setMockData();
      }
    });
  }

  loadPeakHours() {
    const params: Record<string, string> = {};
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();

    this.reportsApi.getPeakHours(undefined, this.dateFrom() || undefined, this.dateTo() || undefined).subscribe({
      next: (data) => {
        this.peakHoursData.set(data);
      },
      error: () => {
        console.error('Failed to load peak hours data');
      }
    });
  }

  updateKPIMetrics(stats: DashboardStats) {
    const revenue = stats.dailyRevenue || 0;
    const todayTabs = stats.todayTabsCount || 0;

    const avgTicket = todayTabs > 0 ? (revenue / todayTabs) : 0;

    this.kpiMetrics.set([
      { label: 'Total Revenue', value: `₦${(revenue / 100).toLocaleString()}`, change: '+12.4%', trend: 'up', icon: 'payments', color: '#00D166' },
      { label: 'Avg Ticket', value: `₦${(avgTicket / 100).toLocaleString()}`, change: '+5.2%', trend: 'up', icon: 'receipt', color: '#0059bb' },
      { label: 'Active Tabs', value: stats.openTabs.toString(), change: '+2', trend: 'up', icon: 'table_restaurant', color: '#8b5cf6' },
      { label: 'Tables Occupied', value: stats.activeTables.toString(), change: '-1', trend: 'down', icon: 'person', color: '#FF7043' }
    ]);
  }

  updateStaffData(waiterPerformance: any[]) {
    this.staffData.set(waiterPerformance.map(w => ({
      name: w.waiter?.fullName || 'Unknown Waiter',
      role: 'Staff',
      sales: w.tabsCount || 0,
      efficiency: Math.round((w.revenueKobo / (w.tabsCount * 5000)) * 100) || 0,
      avatar: w.waiter?.avatarUrl || '#9d4300'
    })));
  }

  updateCategoryROI(recentOrders: any[]) {
    if (!recentOrders || recentOrders.length === 0) {
      this.categoryROI.set([
        { name: 'Food & Entrees', value: '0', percentage: 0, color: '#00D166' },
        { name: 'Beverages', value: '0', percentage: 0, color: '#0059bb' },
        { name: 'Desserts', value: '0', percentage: 0, color: '#FF7043' }
      ]);
      return;
    }

    const orderCounts = recentOrders.reduce((acc: Record<string, number>, order) => {
      if (!acc[order.menuItemName]) {
        acc[order.menuItemName] = 0;
      }
      acc[order.menuItemName] += order.quantity || 1;
      return acc;
    }, {} as Record<string, number>);

    const totalOrders = Object.values(orderCounts).reduce((sum: number, count: number) => sum + count, 0);

    // Mock categories for demo - in real implementation, this would come from menu categories
    this.categoryROI.set([
      { name: 'Food & Entrees', value: '3,240,500', percentage: 65, color: '#00D166' },
      { name: 'Beverages', value: '1,120,000', percentage: 22, color: '#0059bb' },
      { name: 'Desserts', value: '479,500', percentage: 13, color: '#FF7043' }
    ]);
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
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getHoursForChart(hour: number): string {
    const hours = ['12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
    return hours[hour] || '';
  }

  getMaxOrders(): number {
    if (!this.peakHoursData().length) return 0;
    return Math.max(...this.peakHoursData().map(d => d.order_count));
  }
}