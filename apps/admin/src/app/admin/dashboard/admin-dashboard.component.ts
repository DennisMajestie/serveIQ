import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminApiService, AdminBusiness, AdminStats } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dash">
      <!-- Page Header -->
      <header class="dash-header">
        <div class="header-text">
          <h1>Platform Overview</h1>
          <p>Real-time health and activity across all registered businesses.</p>
        </div>
        <div class="header-actions">
          <a class="btn-primary" routerLink="/app/admin/businesses">
            <span class="material-symbols-outlined">business</span>
            Manage Businesses
          </a>
          <a class="btn-secondary" routerLink="/app/autopilot">
            <span class="material-symbols-outlined">smart_toy</span>
            Autopilot AI
          </a>
        </div>
      </header>

      <!-- Stats Row -->
      <section class="stats-row" *ngIf="!loading()">
        <div class="kpi-card">
          <div class="kpi-icon kpi-orange">
            <span class="material-symbols-outlined">store</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_businesses ?? '—' }}</span>
            <span class="kpi-label">Total Businesses</span>
          </div>
          <div class="kpi-trend up">
            <span class="material-symbols-outlined">trending_up</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-green">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.active_businesses ?? '—' }}</span>
            <span class="kpi-label">Active</span>
          </div>
          <div class="kpi-trend up">
            <span class="material-symbols-outlined">trending_up</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-blue">
            <span class="material-symbols-outlined">corporate_fare</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_branches ?? '—' }}</span>
            <span class="kpi-label">Branches</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-purple">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_waiters ?? '—' }}</span>
            <span class="kpi-label">Total Staff</span>
          </div>
        </div>
      </section>

      <!-- Skeleton stats -->
      <section class="stats-row" *ngIf="loading()">
        <div class="kpi-card skeleton" *ngFor="let i of [1,2,3,4]">
          <div class="skel skel-icon"></div>
          <div class="kpi-body">
            <div class="skel skel-val"></div>
            <div class="skel skel-label"></div>
          </div>
        </div>
      </section>

      <!-- Main Grid -->
      <div class="main-grid">
        <!-- Recent Businesses -->
        <section class="panel businesses-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="material-symbols-outlined">business</span>
              <h2>Recent Businesses</h2>
            </div>
            <a class="view-all" routerLink="/app/admin/businesses">View all</a>
          </div>

          <div class="biz-list" *ngIf="!loading()">
            <div class="biz-row" *ngFor="let biz of recentBusinesses(); trackBy: trackById">
              <div class="biz-avatar" [style.background-color]="avatarColor(biz.name)">
                {{ biz.name?.[0]?.toUpperCase() }}
              </div>
              <div class="biz-info">
                <span class="biz-name">{{ biz.name }}</span>
                <span class="biz-meta">{{ biz.type }} · {{ biz.branches?.length || 0 }} branch{{ biz.branches?.length === 1 ? '' : 'es' }}</span>
              </div>
              <div class="biz-right">
                <span class="status-pill" [class.active]="biz.is_active" [class.inactive]="!biz.is_active">
                  {{ biz.is_active ? 'Active' : 'Inactive' }}
                </span>
                <span class="plan-tag">{{ biz.subscription_plan || 'No plan' }}</span>
              </div>
            </div>
            <div class="empty" *ngIf="!recentBusinesses().length">
              <span class="material-symbols-outlined">store_mall_directory</span>
              <p>No businesses registered yet.</p>
            </div>
          </div>

          <!-- skeleton rows -->
          <div class="biz-list" *ngIf="loading()">
            <div class="biz-row skeleton-row" *ngFor="let i of [1,2,3,4,5]">
              <div class="skel skel-avatar"></div>
              <div class="biz-info">
                <div class="skel skel-name"></div>
                <div class="skel skel-meta"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Side cards -->
        <div class="side-cards">
          <!-- System Status -->
          <section class="panel status-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined">dns</span>
                <h2>System Status</h2>
              </div>
            </div>
            <div class="status-list">
              <div class="status-item">
                <span class="dot green"></span>
                <span class="status-name">API</span>
                <span class="status-val online">Operational</span>
              </div>
              <div class="status-item">
                <span class="dot green"></span>
                <span class="status-name">Database</span>
                <span class="status-val online">Operational</span>
              </div>
              <div class="status-item">
                <span class="dot green"></span>
                <span class="status-name">AI Service</span>
                <span class="status-val online">Online</span>
              </div>
              <div class="status-item">
                <span class="dot green"></span>
                <span class="status-name">Auth</span>
                <span class="status-val online">Operational</span>
              </div>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="panel actions-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined">bolt</span>
                <h2>Quick Actions</h2>
              </div>
            </div>
            <div class="action-list">
              <a class="action-item" routerLink="/app/admin/businesses">
                <span class="material-symbols-outlined">business</span>
                <span>All Businesses</span>
                <span class="material-symbols-outlined arrow">chevron_right</span>
              </a>
              <a class="action-item" routerLink="/app/autopilot">
                <span class="material-symbols-outlined">smart_toy</span>
                <span>Autopilot AI</span>
                <span class="material-symbols-outlined arrow">chevron_right</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dash { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }

    /* Header */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .header-text h1 { margin: 0; font-size: 22px; font-weight: 800; color: var(--on-surface); }
    .header-text p { margin: 4px 0 0; font-size: 14px; color: var(--secondary); }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-primary, .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; text-decoration: none; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: var(--on-primary); }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { background: var(--surface-container-low); color: var(--on-surface); border: 1px solid var(--outline-variant); }
    .btn-secondary:hover { background: var(--surface-container); }
    .btn-primary .material-symbols-outlined, .btn-secondary .material-symbols-outlined { font-size: 18px; }

    /* KPI Stats */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon .material-symbols-outlined { font-size: 22px; }
    .kpi-orange { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .kpi-green  { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .kpi-blue   { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }
    .kpi-purple { background: color-mix(in srgb, #a855f7 12%, transparent); color: #a855f7; }
    .kpi-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 26px; font-weight: 800; color: var(--on-surface); line-height: 1; }
    .kpi-label { font-size: 12px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.6px; }
    .kpi-trend { margin-left: auto; }
    .kpi-trend .material-symbols-outlined { font-size: 18px; }
    .kpi-trend.up .material-symbols-outlined { color: #22c55e; }

    /* Main grid */
    .main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

    /* Panels */
    .panel { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 14px; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--outline-variant); }
    .panel-title { display: flex; align-items: center; gap: 10px; }
    .panel-title .material-symbols-outlined { font-size: 18px; color: var(--primary); }
    .panel-title h2 { margin: 0; font-size: 15px; font-weight: 700; color: var(--on-surface); }
    .view-all { font-size: 13px; font-weight: 600; color: var(--primary); text-decoration: none; }
    .view-all:hover { text-decoration: underline; }

    /* Business List */
    .biz-list { display: flex; flex-direction: column; }
    .biz-row { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--outline-variant); transition: background 0.15s; }
    .biz-row:last-child { border-bottom: none; }
    .biz-row:hover { background: var(--surface-container-low); }
    .biz-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .biz-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .biz-name { font-size: 14px; font-weight: 600; color: var(--on-surface); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
    .biz-meta { font-size: 12px; color: var(--secondary); text-transform: capitalize; }
    .biz-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .status-pill { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
    .status-pill.active { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .status-pill.inactive { background: var(--error-container); color: var(--on-error-container); }
    .plan-tag { font-size: 11px; color: var(--secondary); font-weight: 500; text-transform: capitalize; }
    .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px; color: var(--on-surface-variant); text-align: center; }
    .empty .material-symbols-outlined { font-size: 36px; opacity: 0.3; }
    .empty p { margin: 0; font-size: 14px; }

    /* Side cards */
    .side-cards { display: flex; flex-direction: column; gap: 16px; }

    /* Status Panel */
    .status-list { padding: 8px 0; }
    .status-item { display: flex; align-items: center; gap: 10px; padding: 12px 20px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); }
    .dot.amber { background: #f59e0b; }
    .dot.red { background: #ef4444; }
    .status-name { flex: 1; font-size: 14px; color: var(--on-surface); font-weight: 500; }
    .status-val { font-size: 12px; font-weight: 600; }
    .status-val.online { color: #22c55e; }
    .status-val.degraded { color: #f59e0b; }

    /* Actions Panel */
    .action-list { display: flex; flex-direction: column; }
    .action-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--outline-variant); text-decoration: none; color: var(--on-surface); font-size: 14px; font-weight: 500; transition: background 0.15s; cursor: pointer; }
    .action-item:last-child { border-bottom: none; }
    .action-item:hover { background: var(--surface-container-low); color: var(--primary); }
    .action-item .material-symbols-outlined { font-size: 20px; color: var(--secondary); }
    .action-item:hover .material-symbols-outlined { color: var(--primary); }
    .action-item .arrow { margin-left: auto; font-size: 18px; }

    /* Skeletons */
    .kpi-card.skeleton { pointer-events: none; }
    .skel { border-radius: 6px; background: var(--surface-container-low); animation: shimmer 1.5s infinite; }
    .skel-icon { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
    .skel-val { width: 60px; height: 26px; margin-bottom: 6px; }
    .skel-label { width: 80px; height: 12px; }
    .skeleton-row { pointer-events: none; }
    .skel-avatar { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
    .skel-name { width: 140px; height: 14px; margin-bottom: 6px; }
    .skel-meta { width: 90px; height: 12px; }
    @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  loading = signal(true);
  stats = signal<AdminStats | null>(null);
  businesses = signal<AdminBusiness[]>([]);

  recentBusinesses = () => this.businesses().slice(0, 5);

  ngOnInit() {
    this.adminApi.getStats().subscribe({ next: s => this.stats.set(s) });
    this.adminApi.listBusinesses().subscribe({
      next: res => {
        this.businesses.set(Array.isArray(res.data) ? res.data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  trackById(_: number, item: AdminBusiness) { return item.id; }

  avatarColor(name: string): string {
    const colors = ['#f97316','#3b82f6','#a855f7','#22c55e','#e11d48','#0891b2','#ca8a04'];
    const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
    return colors[idx];
  }
}
