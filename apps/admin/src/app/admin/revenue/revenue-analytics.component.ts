import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService, AdminStats, AdminRevenue, AdminRevenueSeries } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

const MRR_COLORS: Record<string, string> = { NGN: '#00D166', USD: '#0059bb', GBP: '#8b5cf6', EUR: '#F59E0B' };

const CURRENCIES: Record<string, { symbol: string; locale: string }> = {
  NGN: { symbol: '₦', locale: 'en-NG' },
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' },
  EUR: { symbol: '€', locale: 'de-DE' },
};

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Revenue &amp; Analytics</h1>
            <p class="page-subtitle">Platform-wide financials: lifetime revenue, subscription health, and growth metrics.</p>
          </div>
          <button class="btn-ghost" (click)="load()" [disabled]="isLoading()">
            <span class="material-symbols-outlined" style="font-size:18px">refresh</span>
          </button>
        </div>
      </header>

      <div *ngIf="isLoading() && !stats()" class="loading-state">
        <p>Loading platform analytics…</p>
      </div>

      <ng-container *ngIf="stats()">
        <!-- KPI cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Lifetime Revenue</div>
            <div class="kpi-value">{{ formatKobo(stats()!.totalRevenueKobo || 0) }}</div>
            <span class="kpi-sub">{{ stats()!.totalBusinesses }} businesses</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active Businesses</div>
            <div class="kpi-value">{{ stats()!.activeBusinesses }}</div>
            <span class="kpi-sub">{{ (stats()!.totalBusinesses || 0) - (stats()!.activeBusinesses || 0) }} inactive</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Subscribers (Active + Trialing)</div>
            <div class="kpi-value">{{ (stats()!.subscriptionActive || 0) + (stats()!.subscriptionTrialing || 0) }}</div>
            <span class="kpi-sub">{{ stats()!.subscriptionPastDue || 0 }} past due</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">New Businesses (30d)</div>
            <div class="kpi-value">{{ stats()!.newBusinessesThisMonth }}</div>
            <span class="kpi-sub">{{ stats()!.totalBranches }} branches</span>
          </div>
          <div class="kpi-card" *ngIf="revenue()">
            <div class="kpi-label">MRR (Active + Trialing)</div>
            <div class="kpi-value">{{ formatMrr() }}</div>
            <span class="kpi-sub">{{ revenue()!.recurringSubscribers || 0 }} paying branches</span>
          </div>
        </div>

        <!-- Revenue trend (last 12 months) -->
        <section class="section" *ngIf="monthlyRevenueSeries().length">
          <h2 class="section-title">Monthly Revenue (last 12 months)</h2>
          <div class="bar-chart">
            <div class="bar-row" *ngFor="let pt of monthlyRevenueSeries()">
              <span class="bar-label">{{ pt.month }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="(pt.revenueKobo || 0) / maxRevenue() * 100"></div>
              </div>
              <span class="bar-count">{{ formatKobo(pt.revenueKobo || 0) }}</span>
            </div>
          </div>
        </section>

        <!-- Subscription status breakdown -->
        <section class="section">
          <h2 class="section-title">Subscription Status</h2>
          <div class="status-grid">
            <div class="status-pill" [class.active]="s.active" *ngFor="let s of statusItems()">
              <span class="status-dot" [class.on]="s.active"></span>
              <span class="status-name">{{ s.label }}</span>
              <span class="status-count">{{ s.count }}</span>
            </div>
          </div>
        </section>

        <!-- Subscription plan breakdown -->
        <section class="section" *ngIf="planItems().length">
          <h2 class="section-title">Subscriptions by Plan</h2>
          <div class="bar-chart">
            <div class="bar-row" *ngFor="let p of planItems()">
              <span class="bar-label">{{ p.plan }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="p.pct"></div>
              </div>
              <span class="bar-count">{{ p.count }}</span>
            </div>
          </div>
        </section>

        <!-- Recent businesses -->
        <section class="section" *ngIf="stats()!.recentBusinesses?.length">
          <h2 class="section-title">Recent Businesses</h2>
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr><th>Business</th><th>Type</th><th>Plan</th><th>Created</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr class="data-row" *ngFor="let b of stats()!.recentBusinesses | slice:0:8">
                  <td class="cell-name">
                    <div class="biz-info">
                      <span class="biz-name">{{ b.name }}</span>
                      <span class="biz-email">{{ b.email }}</span>
                    </div>
                  </td>
                  <td>{{ b.type }}</td>
                  <td>{{ b.subscription_plan }}</td>
                  <td class="cell-mono">{{ b.created_at | date:'shortDate' }}</td>
                  <td>
                    <span class="status-badge" [class.active]="b.is_active" [class.inactive]="!b.is_active">{{ b.is_active ? 'Active' : 'Inactive' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="footer-note">Data is a point-in-time aggregate from the platform database. Numbers are not real-time.</div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; line-height: 1.4; }
    .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--outline_variant); background: transparent; color: var(--on-surface); font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-ghost:hover { background: var(--surface-container-low); }
    .loading-state { text-align: center; padding: 48px; color: var(--secondary); }
    .section { margin-top: 28px; }
    .section-title { font-size: 15px; font-weight: 700; color: var(--on-surface); margin: 0 0 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .kpi-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 20px; border: 1px solid var(--outline_variant); }
    .kpi-label { font-size: 12px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 26px; font-weight: 700; color: var(--on-surface); margin: 6px 0 2px; }
    .kpi-sub { font-size: 12px; color: var(--secondary); }
    .status-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--surface-container-low); color: var(--secondary); white-space: nowrap; }
    .status-pill.active { background: color-mix(in srgb, #22c55e 14%, transparent); color: #22c55e; border: 1px solid color-mix(in srgb, #22c55e 30%, transparent); }
    .status-pill.expired { background: color-mix(in srgb, #f59e0b 14%, transparent); color: #d97706; }
    .status-pill.due { background: color-mix(in srgb, #f97316 14%, transparent); color: #ea580b; }
    .status-pill.canceled { background: var(--error-container); color: var(--on-error-container); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--outline); }
    .status-dot.on { background: currentColor; box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent); }
    .bar-chart { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 140px 1fr 40px; align-items: center; gap: 12px; font-size: 13px; }
    .bar-label { font-weight: 600; color: var(--on-surface); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { background: var(--surface-container-low); border-radius: 8px; height: 14px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--primary); border-radius: 8px; }
    .bar-count { text-align: right; color: var(--secondary); }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline_variant); }
    .data-table td { padding: 12px 16px; font-size: 13px; color: var(--secondary); border-bottom: 1px solid var(--outline_variant); }
    .data-row:hover { background: var(--surface-container-low); }
    .cell-name .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: var(--on-surface); }
    .biz-email { font-size: 12px; color: var(--secondary); font-family: monospace; }
    .cell-mono { font-family: 'ui-monaco', monospace; font-size: 12px; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .status-badge.inactive { background: var(--error-container); color: var(--on-error-container); }
    .footer-note { margin-top: 20px; font-size: 12px; color: var(--secondary); }
  `]
})
export class RevenueAnalyticsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  stats = signal<AdminStats | null>(null);
  revenue = signal<AdminRevenue | null>(null);
  isLoading = signal(false);
  isRevenueLoading = signal(false);

  ngOnInit() {
    this.load();
    this.loadRevenue();
  }

  load() {
    this.isLoading.set(true);
    this.adminApi.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.isLoading.set(false); },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Load Failed', text: err?.message || undefined });
      },
    });
  }

  loadRevenue() {
    this.isRevenueLoading.set(true);
    this.adminApi.getRevenue(12).subscribe({
      next: (r) => { this.revenue.set(r); this.isRevenueLoading.set(false); },
      error: () => this.isRevenueLoading.set(false),
    });
  }

  statusItems() {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Active', count: s.subscriptionActive || 0, active: true },
      { label: 'Trialing', count: s.subscriptionTrialing || 0, active: true },
      { label: 'Past Due', count: s.subscriptionPastDue || 0, active: 'due' },
      { label: 'Expired', count: s.subscriptionExpired || 0, active: 'expired' },
      { label: 'Canceled', count: s.subscriptionCanceled || 0, active: 'canceled' },
    ];
  }

  planItems() {
    const items = this.stats()?.subscriptionBreakdown || [];
    const total = items.reduce((sum, i) => sum + (i.count || 0), 0) || 1;
    return items
      .map((i) => ({ plan: i.plan || 'free_trial', count: i.count || 0, pct: Math.round(((i.count || 0) / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  formatKobo(kobo: number): string {
    const value = kobo / 100;
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  mrrByCurrency(): { currency: string; amount: number; color: string }[] {
    const mrr = this.revenue()?.mrr || {};
    return Object.keys(mrr).map((c) => ({
      currency: c,
      amount: mrr[c],
      color: MRR_COLORS[c] || '#0059bb',
    }));
  }

  formatMrr(): string {
    const items = this.mrrByCurrency();
    if (!items.length) return '—';
    return items
      .map((i) => `₦${(i.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${i.currency}`)
      .join(' · ');
  }

  monthlyRevenueSeries(): AdminRevenueSeries[] {
    return this.revenue()?.monthlyRevenue || [];
  }

  maxRevenue(): number {
    const series = this.monthlyRevenueSeries();
    const max = Math.max(...series.map(s => s.revenueKobo || 0), 0);
    return max || 1;
  }
}
