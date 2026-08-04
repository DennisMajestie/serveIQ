import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminSystemHealth } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-system-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">System Health</h1>
            <p class="page-subtitle">Live status of the ServeIQ API, database, and offline sync queue.<br>Snapshot refreshes every 30 seconds.</p>
          </div>
          <button class="btn-primary" (click)="load()" [disabled]="isLoading()">
            <span class="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
      </header>

      <div class="health-grid" *ngIf="health(); else loading">
        <div class="status-card" [class.ok]="health()!.status === 'healthy'" [class.bad]="health()!.status !== 'healthy'">
          <div class="status-dot" [class.online]="health()!.status === 'healthy'"></div>
          <div>
            <div class="status-label">API Status</div>
            <div class="status-value">{{ health()!.status === 'healthy' ? 'Healthy' : 'Degraded' }}</div>
          </div>
          <span class="timestamp">{{ health()!.timestamp | date:'medium' }}</span>
        </div>

        <div class="metric-card">
          <div class="metric-label">Database</div>
          <div class="metric-value" [class.ok-text]="health()!.database?.connected" [class.bad-text]="!health()!.database?.connected">
            {{ health()!.database?.connected ? 'Connected' : 'Unreachable' }}
          </div>
          <div class="metric-sub">{{ dbLatency() }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Uptime</div>
          <div class="metric-value">{{ formatUptime(health()!.uptimeSeconds || 0) }}</div>
          <div class="metric-sub">since process start</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Memory (RSS)</div>
          <div class="metric-value">{{ health()!.process?.memoryUsedMb ?? '—' }} MB</div>
          <div class="metric-sub">heap {{ health()!.process?.memoryHeapUsedMb ?? '—' }} MB</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Node</div>
          <div class="metric-value">{{ health()!.nodeVersion || '—' }}</div>
          <div class="metric-sub">{{ health()!.environment || 'development' }} · {{ health()!.process?.cpuCores ?? '?' }} cores</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Sync Queue</div>
          <div class="metric-value">
            <span class="sync-pill" [class.warn]="health()!.syncQueue?.pending">{{ health()!.syncQueue?.pending ?? 0 }} pending</span>
            <span class="sync-pill" [class.bad-pill]="health()!.syncQueue?.failed">{{ health()!.syncQueue?.failed ?? 0 }} failed</span>
            <span class="sync-pill">{{ health()!.syncQueue?.total ?? 0 }} total</span>
          </div>
          <div class="metric-sub">offline operations awaiting replay</div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-state">
          <p>{{ isLoading() ? 'Checking system health...' : 'No health data available.' }}</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; line-height: 1.4; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--primary); color: var(--on-primary); border: none; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .status-card, .metric-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 20px; }
    .status-card { display: flex; align-items: center; gap: 14px; }
    .status-card.ok { border-left: 4px solid #22c55e; }
    .status-card.bad { border-left: 4px solid #ef4444; }
    .status-dot { width: 12px; height: 12px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
    .status-dot.online { background: #22c55e; box-shadow: 0 0 0 4px color-mix(in srgb, #22c55e 20%, transparent); }
    .status-label { font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-value { font-size: 20px; font-weight: 700; color: var(--on-surface); }
    .timestamp { margin-left: auto; font-size: 11px; color: var(--secondary); white-space: nowrap; }
    .metric-label { font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .metric-value { font-size: 18px; font-weight: 700; color: var(--on-surface); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .metric-sub { font-size: 12px; color: var(--secondary); margin-top: 4px; }
    .ok-text { color: #22c55e; }
    .bad-text { color: #ef4444; }
    .sync-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--surface-container-low); color: var(--secondary); }
    .sync-pill.warn { background: color-mix(in srgb, #f59e0b 14%, transparent); color: #d97706; }
    .sync-pill.bad-pill { background: var(--error-container); color: var(--on-error-container); }
    .loading-state { text-align: center; padding: 48px; color: var(--secondary); }
  `]
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  private adminApi = inject(AdminApiService);

  health = signal<AdminSystemHealth | null>(null);
  isLoading = signal(false);
  private timer: any;

  ngOnInit() {
    this.load();
    this.timer = setInterval(() => this.load(true), 30000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  load(silent = false) {
    if (!silent) this.isLoading.set(true);
    this.adminApi.getSystemHealth().subscribe({
      next: (h) => {
        this.health.set(h);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (!silent) {
          Swal.fire({ icon: 'error', title: 'Health Check Failed', text: err?.message || undefined });
        }
      },
    });
  }

  formatUptime(seconds: number): string {
    if (!seconds) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  }

  dbLatency(): string {
    const ms = this.health()?.database?.latencyMs;
    return ms != null ? `${ms} ms` : 'no latency data';
  }
}
