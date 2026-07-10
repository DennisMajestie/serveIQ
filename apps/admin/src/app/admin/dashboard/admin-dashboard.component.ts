import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AdminApiService, AdminBusiness, AdminStats } from '@serveiq/shared/data-access';

interface ConsoleLog {
  timestamp: string;
  level: 'info' | 'success' | 'warn';
  message: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dash">
      <!-- Page Header -->
      <header class="dash-header">
        <div class="header-text">
          <div class="tech-badge">PLATFORM COMMAND PANEL</div>
          <h1>System Overview Console</h1>
          <p>Global operations, Autopilot telemetry, and business instances.</p>
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

      <!-- Stats Grid -->
      <section class="stats-row" *ngIf="!loading()">
        <div class="kpi-card">
          <div class="glow-effect orange"></div>
          <div class="kpi-icon kpi-orange">
            <span class="material-symbols-outlined">store</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_businesses ?? '—' }}</span>
            <span class="kpi-label">Active Tenants</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="glow-effect green"></div>
          <div class="kpi-icon kpi-green">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.active_businesses ?? '—' }}</span>
            <span class="kpi-label">Operational</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="glow-effect blue"></div>
          <div class="kpi-icon kpi-blue">
            <span class="material-symbols-outlined">corporate_fare</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_branches ?? '—' }}</span>
            <span class="kpi-label">Total Outlets</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="glow-effect purple"></div>
          <div class="kpi-icon kpi-purple">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats()?.total_waiters ?? '—' }}</span>
            <span class="kpi-label">Active Waiters</span>
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

      <!-- Central Command Layout -->
      <div class="main-grid">
        <!-- Left: Live Log Feed & Telemetry -->
        <div class="panel-column">
          <!-- Terminal Event Logger -->
          <section class="panel terminal-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined ticker-dot animate-pulse">terminal</span>
                <h2>Platform Live Activity Stream</h2>
              </div>
              <span class="badge badge-tech">LIVE MONITOR</span>
            </div>
            
            <div class="terminal-body" #terminalOutput>
              <div class="terminal-logs">
                <div class="log-line" *ngFor="let log of consoleLogs()" [class]="log.level">
                  <span class="log-time">[{{ log.timestamp }}]</span>
                  <span class="log-badge">{{ log.level.toUpperCase() }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Core System Telemetry -->
          <section class="panel telemetry-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined">monitoring</span>
                <h2>Platform Resource Metrics</h2>
              </div>
            </div>
            <div class="telemetry-grid">
              <div class="tel-metric">
                <span class="tel-lbl">System Success Rate</span>
                <span class="tel-val">99.98%</span>
                <div class="progress-container"><div class="progress-bar green" style="width: 99.98%"></div></div>
              </div>
              <div class="tel-metric">
                <span class="tel-lbl">Autopilot Pipeline Latency</span>
                <span class="tel-val">124ms</span>
                <div class="progress-container"><div class="progress-bar orange" style="width: 75%"></div></div>
              </div>
              <div class="tel-metric">
                <span class="tel-lbl">Free vs Pro vs Enterprise</span>
                <span class="tel-val">40% / 45% / 15%</span>
                <div class="segmented-bar">
                  <div class="seg seg-free" style="width: 40%" title="Free"></div>
                  <div class="seg seg-pro" style="width: 45%" title="Pro"></div>
                  <div class="seg seg-ent" style="width: 15%" title="Enterprise"></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right: Instance Listings & Engine Controls -->
        <div class="panel-column">
          <!-- Recent Instantiations -->
          <section class="panel businesses-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined">dns</span>
                <h2>Recent Deployments</h2>
              </div>
              <a class="view-all" routerLink="/app/admin/businesses">View all</a>
            </div>

            <div class="biz-list" *ngIf="!loading()">
              <div class="biz-row" *ngFor="let biz of recentBusinesses(); trackBy: trackById">
                <div class="biz-avatar" [style.background-color]="avatarColor(biz.name)">
                  {{ (biz.name && biz.name[0]) ? biz.name[0].toUpperCase() : '' }}
                </div>
                <div class="biz-info">
                  <span class="biz-name">{{ biz.name }}</span>
                  <span class="biz-meta">{{ biz.type }} · {{ biz.branches?.length || 0 }} Branch{{ biz.branches?.length === 1 ? '' : 'es' }}</span>
                </div>
                <div class="biz-right">
                  <span class="status-pill" [class.active]="biz.is_active" [class.inactive]="!biz.is_active">
                    {{ biz.is_active ? 'Active' : 'Locked' }}
                  </span>
                </div>
              </div>
              <div class="empty" *ngIf="!recentBusinesses().length">
                <span class="material-symbols-outlined">store_mall_directory</span>
                <p>No business accounts registered.</p>
              </div>
            </div>

            <div class="biz-list" *ngIf="loading()">
              <div class="biz-row skeleton-row" *ngFor="let i of [1,2,3,4]">
                <div class="skel skel-avatar"></div>
                <div class="biz-info">
                  <div class="skel skel-name"></div>
                  <div class="skel skel-meta"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Autopilot Engine Status -->
          <section class="panel engine-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="material-symbols-outlined">smart_toy</span>
                <h2>Autopilot AI Engine</h2>
              </div>
            </div>
            <div class="engine-body">
              <div class="engine-param float-item">
                <span class="ep-lbl">Engine Mode</span>
                <span class="ep-val active"><span class="pulse-dot"></span>Autonomous</span>
              </div>
              <div class="engine-param">
                <span class="ep-lbl">Token Throttle</span>
                <span class="ep-val text-cyan">92.4k / Day</span>
              </div>
              <div class="engine-param">
                <span class="ep-lbl">Active Agent Streams</span>
                <span class="ep-val">4 Streams</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dash { padding: 32px; display: flex; flex-direction: column; gap: 28px; font-family: 'Inter', sans-serif; background: transparent; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }

    /* Tech badging */
    .tech-badge { font-family: monospace; font-size: 10px; letter-spacing: 2px; color: var(--primary); font-weight: bold; background: color-mix(in srgb, var(--primary) 12%, transparent); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent); }
    .badge { font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 6px; }
    .badge-tech { background: color-mix(in srgb, var(--on-surface) 10%, transparent); color: var(--secondary); border: 1px solid var(--outline-variant); font-family: monospace; }

    /* Header */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .header-text h1 { margin: 0; font-size: 28px; font-weight: 800; color: var(--on-surface); letter-spacing: -0.5px; }
    .header-text p { margin: 6px 0 0; font-size: 14.5px; color: var(--secondary); }
    .header-actions { display: flex; gap: 12px; }
    .btn-primary, .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 10px; font-size: 13.5px; font-weight: 600; text-decoration: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
    .btn-primary { background: var(--primary); color: var(--on-primary); box-shadow: 0px 4px 14px color-mix(in srgb, var(--primary) 40%, transparent); }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1.5px); box-shadow: 0px 6px 20px color-mix(in srgb, var(--primary) 50%, transparent); }
    .btn-secondary { background: var(--surface-container-low); color: var(--on-surface); border: 1px solid var(--outline-variant); }
    .btn-secondary:hover { background: var(--surface-container); transform: translateY(-1.5px); }

    /* KPI Layout styling */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .kpi-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 18px; position: relative; overflow: hidden; box-shadow: 0 4px 12px color-mix(in srgb, var(--on-surface) 3%, transparent); }
    
    /* Subtle decorative glow effect for sci-fi look */
    .glow-effect { position: absolute; top: -30%; right: -30%; width: 140px; height: 140px; border-radius: 50%; filter: blur(50px); opacity: 0.08; pointer-events: none; transition: opacity 0.5s; }
    .kpi-card:hover .glow-effect { opacity: 0.15; }
    .glow-effect.orange { background: var(--primary); }
    .glow-effect.green { background: #10b981; }
    .glow-effect.blue { background: #3b82f6; }
    .glow-effect.purple { background: #8b5cf6; }

    .kpi-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon .material-symbols-outlined { font-size: 24px; }
    .kpi-orange { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
    .kpi-green  { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; }
    .kpi-blue   { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }
    .kpi-purple { background: color-mix(in srgb, #8b5cf6 12%, transparent); color: #8b5cf6; }
    
    .kpi-body { display: flex; flex-direction: column; gap: 4px; }
    .kpi-value { font-size: 28px; font-weight: 800; color: var(--on-surface); line-height: 1; letter-spacing: -0.5px; }
    .kpi-label { font-size: 11.5px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.8px; }

    /* Core grid structure */
    .main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    @media (max-width: 992px) { .main-grid { grid-template-columns: 1fr; } }
    .panel-column { display: flex; flex-direction: column; gap: 24px; }

    /* Panel aesthetics */
    .panel { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px color-mix(in srgb, var(--on-surface) 2%, transparent); }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--outline-variant); background: color-mix(in srgb, var(--on-surface) 1%, transparent); }
    .panel-title { display: flex; align-items: center; gap: 10px; }
    .panel-title .material-symbols-outlined { font-size: 19px; color: var(--primary); }
    .panel-title h2 { margin: 0; font-size: 14.5px; font-weight: 700; color: var(--on-surface); letter-spacing: -0.2px; }
    .view-all { font-size: 12.5px; font-weight: 600; color: var(--primary); text-decoration: none; }
    .view-all:hover { text-decoration: underline; }

    /* Terminal Console */
    .terminal-panel { border-color: color-mix(in srgb, var(--outline-variant) 80%, black); }
    .terminal-body { background: #0c0f13; padding: 20px; font-family: monospace; font-size: 12px; color: #abb2bf; height: 260px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2c313a #0c0f13; border-top: 1px solid #1e2227; }
    .terminal-logs { display: flex; flex-direction: column; gap: 8px; }
    .log-line { line-height: 1.5; word-break: break-all; display: flex; gap: 6px; }
    .log-time { color: #5c6370; }
    .log-badge { font-weight: bold; font-size: 10px; width: 62px; flex-shrink: 0; padding: 1px 4px; border-radius: 3px; text-align: center; }
    
    .log-line.info .log-badge { background: rgba(97, 175, 239, 0.15); color: #61afef; }
    .log-line.success .log-badge { background: rgba(152, 195, 121, 0.15); color: #98c379; }
    .log-line.warn .log-badge { background: rgba(224, 108, 117, 0.15); color: #e06c75; }
    .log-line.info .log-message { color: #abb2bf; }
    .log-line.success .log-message { color: #98c379; }
    .log-line.warn .log-message { color: #d19a66; }

    /* Ticker indicator */
    .ticker-dot { color: #e5c07b !important; }

    /* Telemetry Info */
    .telemetry-grid { padding: 24px; display: grid; gap: 20px; }
    .tel-metric { display: flex; flex-direction: column; gap: 8px; }
    .tel-lbl { font-size: 12px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.6px; }
    .tel-val { font-size: 15px; font-weight: 700; color: var(--on-surface); }
    
    .progress-container { height: 6px; width: 100%; bg: var(--surface-container-high); background: color-mix(in srgb, var(--outline-variant) 40%, transparent); border-radius: 10px; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 10px; }
    .progress-bar.green { background: #10b981; }
    .progress-bar.orange { background: var(--primary); }

    .segmented-bar { height: 6px; width: 100%; display: flex; border-radius: 10px; overflow: hidden; }
    .seg { height: 100%; transition: all 0.3s; }
    .seg-free { background: #6b7280; }
    .seg-pro { background: var(--primary); }
    .seg-ent { background: #6366f1; }

    /* Deployment instances list */
    .biz-list { display: flex; flex-direction: column; }
    .biz-row { display: flex; align-items: center; gap: 14px; padding: 16px 24px; border-bottom: 1px solid var(--outline-variant); transition: background 0.2s ease; }
    .biz-row:last-child { border-bottom: none; }
    .biz-row:hover { background: color-mix(in srgb, var(--on-surface) 2%, transparent); }
    .biz-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    .biz-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .biz-name { font-size: 14px; font-weight: 600; color: var(--on-surface); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
    .biz-meta { font-size: 12px; color: var(--secondary); text-transform: capitalize; }
    .biz-right { flex-shrink: 0; }
    
    .status-pill { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-pill.active { background: color-mix(in srgb, #10b981 12%, transparent); color: #10b981; border: 1px solid color-mix(in srgb, #10b981 20%, transparent); }
    .status-pill.inactive { background: color-mix(in srgb, #ef4444 12%, transparent); color: #ef4444; border: 1px solid color-mix(in srgb, #ef4444 20%, transparent); }

    /* Engine Status card config */
    .engine-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .engine-param { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: color-mix(in srgb, var(--on-surface) 2%, transparent); border: 1px solid var(--outline-variant); border-radius: 12px; font-size: 13.5px; }
    .ep-lbl { font-weight: 600; color: var(--secondary); }
    .ep-val { font-weight: 700; color: var(--on-surface); display: flex; align-items: center; gap: 8px; }
    .ep-val.active { color: #10b981; }
    .text-cyan { color: #06b6d4 !important; }
    
    .pulse-dot { width: 7px; height: 7px; background: #10b981; border-radius: 50%; animation: pulse-shadow 1.8s infinite; }
    @keyframes pulse-shadow { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 50px 24px; color: var(--secondary); text-align: center; }
    .empty .material-symbols-outlined { font-size: 40px; opacity: 0.25; }
    .empty p { margin: 0; font-size: 13.5px; }

    /* Skeleton Loading State effects */
    .kpi-card.skeleton { pointer-events: none; }
    .skel { border-radius: 6px; background: var(--surface-container-low); animation: shimmer 1.6s infinite; }
    .skel-icon { width: 50px; height: 50px; border-radius: 12px; flex-shrink: 0; }
    .skel-val { width: 65px; height: 28px; margin-bottom: 6px; }
    .skel-label { width: 85px; height: 12px; }
    .skeleton-row { pointer-events: none; }
    .skel-avatar { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
    .skel-name { width: 150px; height: 15px; margin-bottom: 6px; }
    .skel-meta { width: 95px; height: 12px; }
    @keyframes shimmer { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.95; } }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private adminApi = inject(AdminApiService);

  loading = signal(true);
  stats = signal<AdminStats | null>(null);
  businesses = signal<AdminBusiness[]>([]);
  consoleLogs = signal<ConsoleLog[]>([]);

  recentBusinesses = () => this.businesses().slice(0, 5);

  private intervalSub?: Subscription;

  // Log simulation content pool
  private businessNames = ['Prime Grillhouse', 'Gourmet Bistro', 'Salsa Kitchen', 'Golden Ocean', 'Royal Sweets', 'Doughnut Cafe', 'Sizzling Wok'];
  private systemAdjectives = ['Database backup', 'Log consolidation', 'Metric telemetry pipeline', 'API Router pool', 'AI Autopilot auditing thread', 'SSL certificate check'];

  ngOnInit() {
    this.initializeLogs();
    
    this.adminApi.getStats().subscribe({
      next: s => this.stats.set(s)
    });
    
    this.adminApi.listBusinesses().subscribe({
      next: res => {
        this.businesses.set(Array.isArray(res.data) ? res.data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Start live simulator polling every 4.5 seconds
    this.intervalSub = interval(4500).subscribe(() => {
      this.generateLiveLog();
    });
  }

  ngOnDestroy() {
    this.intervalSub?.unsubscribe();
  }

  private initializeLogs() {
    const formatTime = (offsetMs = 0) => {
      const d = new Date(Date.now() - offsetMs);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const initial: ConsoleLog[] = [
      { timestamp: formatTime(15000), level: 'info', message: 'Initializing Super Admin Secure Session...' },
      { timestamp: formatTime(12000), level: 'success', message: 'Established secure connection with PostgreSQL cluster.' },
      { timestamp: formatTime(9000), level: 'info', message: 'Syncing AI Autopilot controller modules...' },
      { timestamp: formatTime(5000), level: 'success', message: 'Autopilot core online. Running in Autonomous throttle mode.' },
      { timestamp: formatTime(2000), level: 'info', message: 'Real-time telemetry event subscription active.' }
    ];

    this.consoleLogs.set(initial);
  }

  private generateLiveLog() {
    const formatCurrentTime = () => {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    // Probabilities: 65% info, 25% success, 10% warn
    const rand = Math.random();
    let level: 'info' | 'success' | 'warn' = 'info';
    let message = '';

    if (rand < 0.65) {
      level = 'info';
      const adj = this.systemAdjectives[Math.floor(Math.random() * this.systemAdjectives.length)];
      const actions = ['refreshed cache', 'reindexed indices', 'checked status: OK', 'cleared socket pool', 'optimized telemetry'];
      const act = actions[Math.floor(Math.random() * actions.length)];
      message = `Admin Engine: ${adj} ${act}.`;
    } else if (rand < 0.90) {
      level = 'success';
      const biz = this.businessNames[Math.floor(Math.random() * this.businessNames.length)];
      const operations = [
        'synchronized sales reports',
        'generated Autopilot insights',
        'recorded terminal activation handshake',
        'refreshed staff permission matrix',
        'processed subscription tier billing cycle'
      ];
      const op = operations[Math.floor(Math.random() * operations.length)];
      message = `Tenant [${biz}]: Successfully ${op}.`;
    } else {
      level = 'warn';
      const hazards = [
        'API Request burst: throttling rule applied to client IP',
        'Database connection pool high availability rollover occurred',
        'Autopilot audit token threshold warning (85% consumed)',
        'Tenant cache sync retry executed'
      ];
      message = `System Alert: ${hazards[Math.floor(Math.random() * hazards.length)]}`;
    }

    const currentLogs = [...this.consoleLogs()];
    currentLogs.push({ timestamp: formatCurrentTime(), level, message });

    // Keep log buffer to last 15 items maximum to prevent DOM bloat
    if (currentLogs.length > 15) {
      currentLogs.shift();
    }
    this.consoleLogs.set(currentLogs);
  }

  trackById(_: number, item: AdminBusiness) { return item.id; }

  avatarColor(name: string): string {
    const colors = ['#f97316','#3b82f6','#a855f7','#10b981','#e11d48','#0891b2','#ca8a04'];
    const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
    return colors[idx];
  }
}
