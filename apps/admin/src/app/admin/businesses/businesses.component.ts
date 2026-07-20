import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminApiService, AdminBusiness, AdminStats, AuthService, SubscriptionFilter } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Business Management</h1>
            <p class="page-subtitle">Oversee all registered businesses across the platform.</p>
          </div>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Businesses</p>
            <p class="stat-value">{{ stats()?.totalBusinesses ?? stats()?.total_businesses ?? '—' }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Active Subscriptions</p>
            <p class="stat-value">{{ activeSubscriptions() }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Expired / Past Due</p>
            <p class="stat-value">{{ expiredSubscriptions() }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Plan Breakdown</p>
            <p class="stat-value">{{ planBreakdown() }}</p>
          </div>
        </article>
      </section>

      <section class="table-card">
        <div class="table-header">
          <h2>All Businesses</h2>
          <div class="table-header-right">
            <div class="filter-tabs">
              <button class="filter-tab" [class.active]="subFilter() === 'all'" (click)="subFilter.set('all')">All</button>
              <button class="filter-tab" [class.active]="subFilter() === 'active'" (click)="subFilter.set('active')">Active</button>
              <button class="filter-tab" [class.active]="subFilter() === 'expired'" (click)="subFilter.set('expired')">Expired</button>
              <button class="filter-tab" [class.active]="subFilter() === 'past_due'" (click)="subFilter.set('past_due')">Past Due</button>
              <button class="filter-tab" [class.active]="subFilter() === 'trialing'" (click)="subFilter.set('trialing')">Trialing</button>
              <button class="filter-tab" [class.active]="subFilter() === 'canceled'" (click)="subFilter.set('canceled')">Canceled</button>
            </div>
            <span class="showing-count" *ngIf="filteredBusinesses().length">Showing {{ filteredBusinesses().length }} businesses</span>
          </div>
        </div>

        <div class="table-wrapper" *ngIf="!isLoading()">
          <table class="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Active</th>
                <th>Owner</th>
                <th>Branches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row" *ngFor="let biz of filteredBusinesses(); trackBy: trackById" (click)="openDashboard(biz)" style="cursor:pointer;">
                <td class="cell-name">
                  <div class="biz-info">
                    <span class="biz-name">{{ biz.name }}</span>
                    <span class="biz-email">{{ biz.email }}</span>
                  </div>
                </td>
                <td><span class="type-pill">{{ biz.subscriptionPlan ?? biz.subscription_plan }}</span></td>
                <td>
                  <span class="sub-badge" [class]="'sub-' + subStatus(biz)">
                    {{ subLabel(biz) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class.active]="(biz.isActive ?? biz.is_active)" [class.inactive]="!(biz.isActive ?? biz.is_active)">
                    {{ (biz.isActive ?? biz.is_active) ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>{{ (biz.owner?.fullName ?? biz.owner?.full_name) || '—' }}</td>
                <td>{{ biz.branches?.length || 0 }}</td>
                <td class="cell-actions" (click)="$event.stopPropagation()">
                  <button class="action-icon-btn" (click)="openDashboard(biz)" title="Impersonate">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                  <button class="action-icon-btn" (click)="toggleActive(biz)" [title]="(biz.isActive ?? biz.is_active) ? 'Deactivate' : 'Activate'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path *ngIf="biz.is_active" d="m4.93 4.93 14.14 14.14"/>
                      <path *ngIf="!biz.is_active" d="M12 2a10 10 0 0 1 0 20"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!filteredBusinesses().length">
                <td colspan="7" class="empty-state">No businesses match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="loading-state" *ngIf="isLoading()">
          <p>Loading businesses...</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    .title-group { }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: var(--surface-container-lowest); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon svg { width: 24px; height: 24px; }
    .stat-icon--orange { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .stat-icon--green { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .stat-icon--blue { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }
    .stat-icon--purple { background: color-mix(in srgb, #a855f7 12%, transparent); color: #a855f7; }
    .stat-icon--red { background: color-mix(in srgb, #ef4444 12%, transparent); color: #ef4444; }
    .stat-content { }
    .stat-label { font-size: 12px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--on-surface); margin: 0; }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--outline-variant); }
    .table-header h2 { font-size: 16px; font-weight: 700; color: var(--on-surface); margin: 0; }
    .table-header-right { display: flex; align-items: center; gap: 16px; }
    .showing-count { font-size: 13px; color: var(--secondary); white-space: nowrap; }
    .filter-tabs { display: flex; gap: 4px; }
    .filter-tab { background: transparent; border: 1px solid var(--outline-variant); color: var(--secondary); font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .filter-tab:hover { background: var(--surface-container-high); }
    .filter-tab.active { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
    .sub-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .sub-badge.sub-active { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .sub-badge.sub-trialing { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }
    .sub-badge.sub-past_due { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }
    .sub-badge.sub-expired { background: color-mix(in srgb, #ef4444 12%, transparent); color: #ef4444; }
    .sub-badge.sub-canceled { background: color-mix(in srgb, #6b7280 12%, transparent); color: #6b7280; }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline-variant); }
    .data-table td { padding: 14px 16px; font-size: 14px; color: var(--secondary); border-bottom: 1px solid var(--outline-variant); }
    .data-row:hover { background: var(--surface-container-low); }
    .cell-name { }
    .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: var(--on-surface); }
    .biz-email { font-size: 12px; color: var(--secondary); }
    .type-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--surface-container-low); color: var(--secondary); text-transform: capitalize; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .status-badge.inactive { background: var(--error-container); color: var(--on-error-container); }
    .cell-actions { text-align: right; }
    .action-icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: var(--secondary); transition: all 0.15s; }
    .action-icon-btn:hover { background: var(--surface-container-low); color: var(--primary); }
    .action-icon-btn svg { width: 20px; height: 20px; }
    .empty-state { text-align: center; padding: 48px; color: var(--secondary); font-size: 14px; }
    .loading-state { text-align: center; padding: 48px; color: var(--secondary); }
  `]
})
export class BusinessesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(true);
  businesses = signal<AdminBusiness[]>([]);
  stats = signal<AdminStats | null>(null);
  subFilter = signal<SubscriptionFilter>('all');

  filteredBusinesses = computed(() => {
    const list = this.businesses();
    const filter = this.subFilter();
    if (filter === 'all') return list;
    return list.filter(b => this.subStatus(b) === filter);
  });

  activeSubscriptions = computed(() =>
    this.businesses().filter(b => this.subStatus(b) === 'active').length
  );

  expiredSubscriptions = computed(() =>
    this.businesses().filter(b => {
      const s = this.subStatus(b);
      return s === 'expired' || s === 'past_due' || s === 'canceled';
    }).length
  );

  planBreakdown = computed(() => {
    const plans = this.businesses().reduce((acc, b) => {
      const plan = (b.subscriptionPlan ?? b.subscription_plan) || 'unknown';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(plans).map(([k, v]) => `${k}: ${v}`).join(' · ');
  });

  ngOnInit() {
    this.loadStats();
    this.loadBusinesses();
  }

  trackById(_: number, item: AdminBusiness): string {
    return item.id;
  }

  subStatus(biz: AdminBusiness): string {
    return (biz.subscriptionStatus ?? biz.subscription_status || 'active').toLowerCase();
  }

  subLabel(biz: AdminBusiness): string {
    const s = this.subStatus(biz);
    return s === 'past_due' ? 'Past Due' : s.charAt(0).toUpperCase() + s.slice(1);
  }

  private loadStats() {
    this.adminApi.getStats().subscribe({
      next: (s) => this.stats.set(s),
    });
  }

  private loadBusinesses() {
    this.isLoading.set(true);
    this.adminApi.listBusinesses().subscribe({
      next: (res) => {
        const list = Array.isArray(res)
          ? res
          : (res && Array.isArray((res as any).data) ? (res as any).data : []);
        this.businesses.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggleActive(biz: AdminBusiness) {
    const newActiveState = !(biz.isActive ?? biz.is_active);
    this.adminApi.toggleBusinessActive(biz.id, newActiveState).subscribe({
      next: (updated) => {
        this.businesses.update(list =>
          list.map(b => b.id === updated.id ? { ...b, ...updated } : b)
        );
      },
    });
  }

  openDashboard(biz: AdminBusiness) {
    const branchId = biz.branches?.[0]?.id;
    this.authService.impersonate(biz.id, branchId, biz.name).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => {},
    });
  }
}
