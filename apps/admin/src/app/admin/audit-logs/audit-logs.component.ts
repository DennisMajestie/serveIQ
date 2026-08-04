import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminAuditLog } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Audit Logs</h1>
            <p class="page-subtitle">Platform-wide audit trail of every logged action. Filter by entity type, action, or date range.</p>
          </div>
        </div>
      </header>

      <section class="filter-bar">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Action</label>
            <input class="filter-input" [(ngModel)]="filters.action" (ngModelChange)="apply()" placeholder="e.g. order.approve" />
          </div>
          <div class="filter-group">
            <label class="filter-label">Entity Type</label>
            <input class="filter-input" [(ngModel)]="filters.entityType" (change)="apply()" placeholder="e.g. order, tab" />
          </div>
          <div class="filter-group">
            <label class="filter-label">From</label>
            <input class="filter-input" type="date" [(ngModel)]="filters.dateFrom" (change)="apply()" />
          </div>
          <div class="filter-group">
            <label class="filter-label">To</label>
            <input class="filter-input" type="date" [(ngModel)]="filters.dateTo" (change)="apply()" />
          </div>
          <div class="filter-group">
            <label class="filter-label">Limit</label>
            <input class="filter-input" type="number" min="25" max="100" [(ngModel)]="filters.limit" (change)="apply()" />
          </div>
          <button class="btn-ghost" (click)="reset()">Reset</button>
        </div>
      </section>

      <div class="table-card" *ngIf="logs().length; else empty">
        <table class="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
              <th>Business</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            <tr class="data-row" *ngFor="let log of logs(); trackBy: trackById">
              <td class="cell-mono">{{ log.createdAt | date:'short' }}</td>
              <td><span class="action-text">{{ log.action }}</span></td>
              <td><span class="entity-text">{{ log.entityType || '—' }}</span><span class="entity-id" *ngIf="log.entityId"> · {{ log.entityId | slice:0:8 }}</span></td>
              <td>
                <div class="biz-info" *ngIf="log.userName; else noUser">
                  <span class="biz-name">{{ log.userName }}</span>
                  <span class="biz-email">{{ log.userRole }}</span>
                </div>
                <ng-template #noUser><span class="biz-email">system</span></ng-template>
              </td>
              <td>
                <div class="biz-info">
                  <span class="biz-name">{{ log.businessName || '—' }}</span>
                  <span class="biz-email">{{ log.branchName || '' }}</span>
                </div>
              </td>
              <td>
                <button *ngIf="log.payload && hasKeys(log.payload)" class="action-icon-btn" (click)="inspect(log)" title="View payload">
                  <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
                </button>
                <span *ngIf="!log.payload || !hasKeys(log.payload)" class="biz-email">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="table-footer">
          <div class="meta-count">{{ meta().total ?? 0 }} entries</div>
          <div class="pagination">
            <button class="page-btn" [disabled]="meta().page === 1" (click)="changePage(meta().page - 1)">
              <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
            </button>
            <span class="page-info">Page {{ meta().page }} of {{ meta().totalPages }}</span>
            <button class="page-btn" [disabled]="meta().page >= (meta().totalPages || 1)" (click)="changePage(meta().page + 1)">
              <span class="material-symbols-outlined" style="font-size:16px">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="loading-state" *ngIf="isLoading()">
          <p>Loading audit logs...</p>
        </div>
        <div class="empty-state" *ngIf="!isLoading()">
          No audit log entries found.
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 24px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; line-height: 1.4; }
    .filter-bar { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 16px 20px; margin-bottom: 20px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
    .filter-label { font-size: 11px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .filter-input { padding: 8px 10px; border: 1px solid var(--outline-variant); border-radius: 8px; background: var(--surface-container-lowest); color: var(--on-surface); font-size: 13px; min-width: 140px; }
    .filter-input:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
    .btn-ghost { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--outline-variant); background: transparent; color: var(--on-surface); font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-ghost:hover { background: var(--surface-container-low); }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline_variant); }
    .data-table td { padding: 14px 16px; font-size: 13px; color: var(--secondary); border-bottom: 1px solid var(--outline_variant); max-width: 220px; }
    .data-row:hover { background: var(--surface-container-low); }
    .cell-mono { font-family: 'ui-monaco', monospace; font-size: 12px; }
    .action-text { font-weight: 600; color: var(--on-surface); font-family: 'ui-monaco', monospace; font-size: 12px; }
    .entity-text { font-weight: 600; color: var(--on-surface); }
    .entity-id { color: var(--secondary); margin-left: 4px; }
    .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: var(--on-surface); }
    .biz-email { font-size: 12px; color: var(--secondary); font-family: monospace; }
    .table-footer { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid var(--outline_variant); font-size: 13px; }
    .meta-count { color: var(--secondary); }
    .pagination { display: flex; align-items: center; gap: 6px; }
    .page-btn { background: none; border: 1px solid var(--outline_variant); border-radius: 6px; padding: 6px 10px; cursor: pointer; color: var(--on-surface); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: var(--secondary); }
    .loading-state, .empty-state { text-align: center; padding: 48px; color: var(--secondary); }
  `]
})
export class AuditLogsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  logs = signal<AdminAuditLog[]>([]);
  meta = signal<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0, page: 1, limit: 50, totalPages: 0,
  });
  isLoading = signal(false);

  filters = {
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
  };

  ngOnInit() {
    this.load();
  }

  trackById(_: number, log: AdminAuditLog): string {
    return log.id;
  }

  hasKeys(obj: any): boolean {
    return !!(obj && Object.keys(obj).length);
  }

  apply() {
    this.meta.set({ total: 0, page: 1, limit: this.filters.limit, totalPages: 0 });
    this.load();
  }

  changePage(page: number) {
    if (page < 1 || (this.meta().totalPages && page > this.meta().totalPages)) return;
    this.meta.update((m) => ({ ...m, page }));
    this.load(page);
  }

  reset() {
    this.filters = { action: '', entityType: '', dateFrom: '', dateTo: '', limit: 50 };
    this.meta.set({ total: 0, page: 1, limit: 50, totalPages: 0 });
    this.load();
  }

  inspect(log: AdminAuditLog) {
    Swal_viewPayload(log.payload);
  }

  private load(page?: number) {
    this.isLoading.set(true);
    const p = page || (this.meta().page || 1);
    const params: Record<string, string | number> = {
      page: p,
      limit: this.filters.limit,
    };
    if (this.filters.action) params['action'] = this.filters.action;
    if (this.filters.entityType) params['entity_type'] = this.filters.entityType;
    if (this.filters.dateFrom) params['date_from'] = this.filters.dateFrom;
    if (this.filters.dateTo) params['date_to'] = this.filters.dateTo;

    this.adminApi.getAdminAuditLogs(params).subscribe({
      next: (res) => {
        const data = (res && res.data) || [];
        this.logs.set(data);
        this.meta.set({
          total: res?.meta?.total || 0,
          page: res?.meta?.page || p,
          limit: res?.meta?.limit || this.filters.limit,
          totalPages: res?.meta?.totalPages || 0,
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

function Swal_viewPayload(payload: any) {
  Swal.fire({
    title: 'Audit Payload',
    html: `<pre class="swal2-text" style="font-family:monospace;font-size:12px;max-height:420px;overflow:auto;margin:0;">${JSON.stringify(payload, null, 2)}</pre>`,
    width: 720,
  });
}
