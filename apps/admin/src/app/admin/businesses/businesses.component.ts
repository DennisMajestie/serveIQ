import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminApiService, AdminBusiness, AdminStats } from '@serveiq/shared/data-access';

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

      <section class="stats-grid" *ngIf="stats()">
        <article class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Businesses</p>
            <p class="stat-value">{{ stats()?.total_businesses }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Active</p>
            <p class="stat-value">{{ stats()?.active_businesses }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Branches</p>
            <p class="stat-value">{{ stats()?.total_branches }}</p>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Waiters</p>
            <p class="stat-value">{{ stats()?.total_waiters }}</p>
          </div>
        </article>
      </section>

      <section class="table-card">
        <div class="table-header">
          <h2>All Businesses</h2>
          <span class="showing-count" *ngIf="businesses().length">Showing {{ businesses().length }} businesses</span>
        </div>

        <div class="table-wrapper" *ngIf="!isLoading()">
          <table class="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Branches</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row" *ngFor="let biz of businesses(); trackBy: trackById">
                <td class="cell-name">
                  <div class="biz-info">
                    <span class="biz-name">{{ biz.name }}</span>
                    <span class="biz-email">{{ biz.email }}</span>
                  </div>
                </td>
                <td><span class="type-pill">{{ biz.type }}</span></td>
                <td>{{ biz.owner?.full_name || '—' }}</td>
                <td>{{ biz.branches?.length || 0 }}</td>
                <td>{{ biz.subscription_plan }}</td>
                <td>
                  <span class="status-badge" [class.active]="biz.is_active" [class.inactive]="!biz.is_active">
                    {{ biz.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="action-icon-btn" (click)="toggleActive(biz)" [title]="biz.is_active ? 'Deactivate' : 'Activate'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path *ngIf="biz.is_active" d="m4.93 4.93 14.14 14.14"/>
                      <path *ngIf="!biz.is_active" d="M12 2a10 10 0 0 1 0 20"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!businesses().length">
                <td colspan="7" class="empty-state">No businesses found.</td>
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
    .page-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon svg { width: 24px; height: 24px; }
    .stat-icon--orange { background: #fff3e0; color: #f97316; }
    .stat-icon--green { background: #e8f5e9; color: #22c55e; }
    .stat-icon--blue { background: #e3f2fd; color: #3b82f6; }
    .stat-icon--purple { background: #f3e5f5; color: #a855f7; }
    .stat-content { }
    .stat-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0; }
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
    .table-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .showing-count { font-size: 13px; color: #64748b; }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 14px 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-row:hover { background: #f8fafc; }
    .cell-name { }
    .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: #1e293b; }
    .biz-email { font-size: 12px; color: #94a3b8; }
    .type-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; text-transform: capitalize; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.inactive { background: #fef2f2; color: #dc2626; }
    .cell-actions { text-align: right; }
    .action-icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: #64748b; transition: all 0.15s; }
    .action-icon-btn:hover { background: #f1f5f9; color: #f97316; }
    .action-icon-btn svg { width: 20px; height: 20px; }
    .empty-state { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
    .loading-state { text-align: center; padding: 48px; color: #64748b; }
  `]
})
export class BusinessesComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  isLoading = signal(true);
  businesses = signal<AdminBusiness[]>([]);
  stats = signal<AdminStats | null>(null);

  ngOnInit() {
    this.loadStats();
    this.loadBusinesses();
  }

  trackById(_: number, item: AdminBusiness): string {
    return item.id;
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
        this.businesses.set(Array.isArray(res.data) ? res.data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggleActive(biz: AdminBusiness) {
    this.adminApi.toggleBusinessActive(biz.id).subscribe({
      next: (updated) => {
        this.businesses.update(list =>
          list.map(b => b.id === updated.id ? { ...b, is_active: updated.is_active } : b)
        );
      },
    });
  }
}
