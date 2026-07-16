import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuditApiService, AuthService } from '@serveiq/shared/data-access';
import { AuditLog, AuditLogResponse } from '@serveiq/shared/models';

@Component({
  selector: 'app-activity-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="activity-page">
      <header class="activity-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>Activity History</h1>
        </div>
        <span class="header-count">{{ total }} entries</span>
      </header>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="filters.action"
          (input)="applyFilters()"
          placeholder="Action (e.g. order.approve)"
          class="filter-input"
        />
        <input
          type="text"
          [(ngModel)]="filters.entityType"
          (input)="applyFilters()"
          placeholder="Entity type"
          class="filter-input"
        />
        <input
          type="date"
          [(ngModel)]="filters.dateFrom"
          (change)="applyFilters()"
          class="filter-input date-input"
        />
        <input
          type="date"
          [(ngModel)]="filters.dateTo"
          (change)="applyFilters()"
          class="filter-input date-input"
        />
        <button class="btn-clear" (click)="clearFilters()" [disabled]="!hasActiveFilters()">Clear</button>
      </div>

      @if (isLoading()) {
        <div class="loading">Loading...</div>
      } @else if (logs().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">search_off</span>
          <p>No activity logs match your filters.</p>
        </div>
      } @else {
        <div class="activity-table">
          <div class="table-header">
            <span class="col-time">Time</span>
            <span class="col-action">Action</span>
            <span class="col-entity">Entity</span>
            <span class="col-user">User</span>
          </div>
          @for (log of logs(); track log.id) {
            <div class="table-row">
              <span class="col-time">{{ log.createdAt | date:'MMM d, h:mm a' }}</span>
              <span class="col-action">
                <span class="action-badge" [class]="getActionClass(log.action)">{{ formatAction(log.action) }}</span>
              </span>
              <span class="col-entity">{{ log.entityType || '—' }} {{ log.entityId ? log.entityId.slice(0,8) : '' }}</span>
              <span class="col-user">{{ log.userId ? log.userId.slice(0,8) : '—' }}</span>
            </div>
          }
        </div>

        <div class="pagination">
          <button (click)="goToPage(page - 1)" [disabled]="page <= 1">Previous</button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Next</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .activity-page { padding: 16px; max-width: 960px; margin: 0 auto; color: #e0e0e0; }
    .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .back-btn { background: none; border: none; color: #e0e0e0; cursor: pointer; padding: 4px; }
    .back-btn:hover { color: #fff; }
    .header-count { font-size: 13px; color: #888; }
    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .filter-input { flex: 1; min-width: 120px; padding: 8px 12px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: #e0e0e0; font-size: 13px; }
    .filter-input::placeholder { color: #666; }
    .date-input { min-width: 140px; }
    .btn-clear { padding: 8px 16px; border-radius: 8px; border: 1px solid #444; background: transparent; color: #e0e0e0; cursor: pointer; }
    .btn-clear:disabled { opacity: 0.4; cursor: default; }
    .loading { text-align: center; padding: 40px; color: #888; }
    .empty-state { text-align: center; padding: 60px 16px; color: #666; }
    .empty-state .material-symbols-outlined { font-size: 48px; }
    .activity-table { border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 140px 1fr 160px 100px; gap: 8px; padding: 10px 16px; background: #1a1a1a; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #2a2a2a; }
    .table-row { display: grid; grid-template-columns: 140px 1fr 160px 100px; gap: 8px; padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #222; }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: rgba(255,255,255,0.03); }
    .col-time { color: #888; }
    .action-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .action-badge.approve { background: rgba(76, 175, 80, 0.15); color: #81c784; }
    .action-badge.decline { background: rgba(244, 67, 54, 0.15); color: #e57373; }
    .action-badge.deliver { background: rgba(33, 150, 243, 0.15); color: #64b5f6; }
    .action-badge.pin { background: rgba(255, 152, 0, 0.15); color: #ffb74d; }
    .action-badge.user { background: rgba(156, 39, 176, 0.15); color: #ce93d8; }
    .action-badge.info { background: rgba(158, 158, 158, 0.15); color: #bdbdbd; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
    .pagination button { padding: 6px 16px; border-radius: 8px; border: 1px solid #333; background: transparent; color: #e0e0e0; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: default; }
    .pagination span { font-size: 13px; color: #888; }
  `]
})
export class ActivityHistoryComponent implements OnInit {
  private auditApi = inject(AuditApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  logs = signal<AuditLog[]>([]);
  isLoading = signal(false);
  page = 1;
  total = 0;
  limit = 30;
  totalPages = 0;

  filters = {
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
  };

  filterKeys = ['action', 'entityType', 'dateFrom', 'dateTo'] as const;
  filterLabels: Record<string, string> = {
    action: 'action',
    entityType: 'entity_type',
    dateFrom: 'date_from',
    dateTo: 'date_to',
  };

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading.set(true);
    const params: Record<string, string | number> = { page: this.page, limit: this.limit };
    if (this.filters.action) params['action'] = this.filters.action;
    if (this.filters.entityType) params['entity_type'] = this.filters.entityType;
    if (this.filters.dateFrom) params['date_from'] = this.filters.dateFrom;
    if (this.filters.dateTo) params['date_to'] = this.filters.dateTo;

    this.auditApi.list(params).subscribe({
      next: (res) => {
        this.logs.set(res.data);
        this.total = res.meta.total;
        this.totalPages = res.meta.totalPages;
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  applyFilters() {
    this.page = 1;
    this.loadLogs();
  }

  clearFilters() {
    this.filters = { action: '', entityType: '', dateFrom: '', dateTo: '' };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(v => v.length > 0);
  }

  goToPage(p: number) {
    if (p < 1 || (this.totalPages && p > this.totalPages)) return;
    this.page = p;
    this.loadLogs();
  }

  goBack() {
    this.router.navigate(['/supervisor/orders']);
  }

  formatAction(action: string): string {
    const map: Record<string, string> = {
      'order.approve': 'Approved',
      'order.decline': 'Declined',
      'order.deliver': 'Delivered',
      'STAFF_PIN_RESET': 'PIN Reset',
      'WAITER_CREATED': 'Waiter Created',
      'SUPERVISOR_CREATED': 'Supervisor Created',
      'PROFILE_UPDATED': 'Profile Updated',
      'USER_DEACTIVATED': 'Deactivated',
      'USER_DELETED': 'Deleted',
      'SUPERVISOR_DELETED': 'Deleted',
    };
    return map[action] || action.replace(/_/g, ' ');
  }

  getActionClass(action: string): string {
    if (action.includes('approve')) return 'approve';
    if (action.includes('decline')) return 'decline';
    if (action.includes('deliver')) return 'deliver';
    if (action.includes('PIN') || action.includes('pin')) return 'pin';
    if (action.includes('CREATED') || action.includes('DEACTIVATED') || action.includes('DELETED') || action.includes('UPDATED')) return 'user';
    return 'info';
  }
}
