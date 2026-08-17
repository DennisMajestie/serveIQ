import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminFeedback } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature Request',
  ux: 'UX Improvement',
  performance: 'Performance',
  other: 'Other',
};

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Platform Feedback</h1>
            <p class="page-subtitle">
              Beta feedback submitted by staff across all businesses. Review and
              resolve submissions.
            </p>
          </div>
        </div>
      </header>

      <section class="filter-bar">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" [(ngModel)]="filters.status" (ngModelChange)="apply()">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <button class="btn-ghost" (click)="reset()">Reset</button>
        </div>
      </section>

      <div class="table-card" *ngIf="items().length; else empty">
        <table class="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Category</th>
              <th>Message</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="data-row" *ngFor="let item of items(); trackBy: trackById">
              <td class="cell-mono">{{ item.created_at | date:'short' }}</td>
              <td><span class="cat-pill">{{ categoryLabel(item.category) }}</span></td>
              <td class="cell-message" [title]="item.message">{{ item.message }}</td>
              <td>
                <div class="biz-info">
                  <span class="biz-name">{{ item.user?.full_name ?? item.user?.fullName ?? 'Staff' }}</span>
                  <span class="biz-email">{{ item.user?.email || item.branch_id || '—' }}</span>
                </div>
              </td>
              <td>
                <span class="status-badge" [class]="'status-' + item.status">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="cell-actions">
                <button class="action-icon-btn" (click)="inspect(item)" title="View details">
                  <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
                </button>
                <button
                  *ngIf="item.status !== 'resolved'"
                  class="action-icon-btn"
                  (click)="setStatus(item, 'resolved')"
                  title="Mark resolved"
                >
                  <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="table-footer">
          <div class="meta-count">{{ meta().total ?? 0 }} submissions</div>
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
          <p>Loading feedback...</p>
        </div>
        <div class="empty-state" *ngIf="!isLoading()">
          No feedback submissions found.
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
    .filter-select { padding: 8px 10px; border: 1px solid var(--outline-variant); border-radius: 8px; background: var(--surface-container-lowest); color: var(--on-surface); font-size: 13px; min-width: 150px; }
    .filter-select:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
    .btn-ghost { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--outline-variant); background: transparent; color: var(--on-surface); font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-ghost:hover { background: var(--surface-container-low); }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline_variant); }
    .data-table td { padding: 14px 16px; font-size: 13px; color: var(--secondary); border-bottom: 1px solid var(--outline_variant); }
    .data-row:hover { background: var(--surface-container-low); }
    .cell-mono { font-family: 'ui-monaco', monospace; font-size: 12px; white-space: nowrap; }
    .cell-message { max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--on-surface); }
    .cat-pill { background: var(--surface-container-high); border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600; color: var(--on-surface); }
    .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: var(--on-surface); }
    .biz-email { font-size: 12px; color: var(--secondary); font-family: monospace; }
    .status-badge { border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
    .status-open { background: rgba(245, 158, 11, 0.15); color: #b45309; }
    .status-in_review { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
    .status-resolved { background: rgba(16, 185, 129, 0.15); color: #059669; }
    .cell-actions { white-space: nowrap; }
    .action-icon-btn { background: none; border: 1px solid var(--outline_variant); border-radius: 6px; padding: 4px 8px; cursor: pointer; color: var(--secondary); margin-right: 4px; }
    .action-icon-btn:hover { color: var(--primary); border-color: var(--primary); }
    .table-footer { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid var(--outline_variant); font-size: 13px; }
    .meta-count { color: var(--secondary); }
    .pagination { display: flex; align-items: center; gap: 6px; }
    .page-btn { background: none; border: 1px solid var(--outline_variant); border-radius: 6px; padding: 6px 10px; cursor: pointer; color: var(--on-surface); }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-info { font-size: 13px; color: var(--secondary); }
    .loading-state, .empty-state { text-align: center; padding: 48px; color: var(--secondary); }
  `]
})
export class FeedbackListComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  items = signal<AdminFeedback[]>([]);
  meta = signal<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0, page: 1, limit: 50, totalPages: 0,
  });
  isLoading = signal(false);
  filters = { status: '' };

  ngOnInit() {
    this.load();
  }

  trackById(_: number, item: AdminFeedback): string {
    return item.id;
  }

  categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  apply() {
    this.meta.set({ total: 0, page: 1, limit: 50, totalPages: 0 });
    this.load();
  }

  changePage(page: number) {
    if (page < 1 || (this.meta().totalPages && page > this.meta().totalPages)) return;
    this.meta.update((m) => ({ ...m, page }));
    this.load(page);
  }

  reset() {
    this.filters = { status: '' };
    this.meta.set({ total: 0, page: 1, limit: 50, totalPages: 0 });
    this.load();
  }

  inspect(item: AdminFeedback) {
    const user = item.user?.full_name ?? item.user?.fullName ?? 'Staff';
    const html = `
      <div style="text-align:left;font-family:inherit;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 8px;"><strong>${this.categoryLabel(item.category)}</strong> · submitted <em>${new Date(item.created_at).toLocaleString()}</em></p>
        <p style="margin:0 0 8px;color:#374151;">${item.message.replace(/</g, '&lt;')}</p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">By <strong>${user}</strong>${item.user?.email ? ' (' + item.user.email + ')' : ''}</p>
        ${item.url ? `<p style="margin:0 0 8px;font-size:13px;">URL: <a href="${item.url}" target="_blank" rel="noopener">${item.url}</a></p>` : ''}
        ${item.screenshot ? `<p style="margin:0 0 8px;font-size:13px;">Screenshot attached: <a href="${item.screenshot}" target="_blank" rel="noopener">view</a></p>` : ''}
        ${item.admin_notes ? `<p style="margin:0;font-size:13px;color:#374151;"><strong>Admin notes:</strong> ${item.admin_notes}</p>` : ''}
      </div>
    `;
    Swal.fire({
      title: 'Feedback Detail',
      html,
      width: 640,
      showCancelButton: true,
      cancelButtonText: 'Close',
      showConfirmButton: item.status !== 'resolved',
      confirmButtonText: 'Mark Resolved',
      confirmButtonColor: '#10b981',
    }).then((result) => {
      if (result.isConfirmed) {
        this.setStatus(item, 'resolved');
      }
    });
  }

  setStatus(item: AdminFeedback, status: string) {
    this.adminApi.updateFeedbackStatus(item.id, status).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
        );
      },
      error: () => {
        Swal.fire('Update failed', 'Could not update feedback status. Please try again.', 'error');
      },
    });
  }

  private load(page?: number) {
    this.isLoading.set(true);
    const p = page || (this.meta().page || 1);
    const params: Record<string, string | number> = { page: p, limit: 50 };
    if (this.filters.status) params['status'] = this.filters.status;

    this.adminApi.getAdminFeedback(params).subscribe({
      next: (res) => {
        const data = (res && res.data) || [];
        this.items.set(data);
        this.meta.set({
          total: res?.meta?.total || 0,
          page: res?.meta?.page || p,
          limit: res?.meta?.limit || 50,
          totalPages: res?.meta?.totalPages || 0,
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}