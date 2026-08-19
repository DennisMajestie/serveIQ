import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminApiService, AdminBusiness, AdminStats, AuthService, SubscriptionFilter } from '@serveiq/shared/data-access';
import { ShiftTemplate, CreateShiftTemplateRequest, ShiftType } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Impersonation Loader Overlay -->
    <div class="impersonate-overlay" *ngIf="impersonatingId()">
      <div class="impersonate-loader">
        <div class="spinner"></div>
        <p>Opening <strong>{{ impersonatingId() }}</strong> dashboard…</p>
      </div>
    </div>

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
            <p class="stat-value">{{ stats()?.totalBusinesses ?? '—' }}</p>
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
            <p class="stat-value stat-value--long">{{ planBreakdown() }}</p>
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
                  <button class="action-icon-btn" *ngIf="subStatus(biz) === 'expired' || subStatus(biz) === 'past_due'" (click)="extendSubscription(biz)" title="Extend subscription">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </button>
                  <button class="action-icon-btn" (click)="openShiftTemplates(biz)" title="Shift Templates">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
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

    <!-- Shift Templates Modal -->
    <div class="impersonate-overlay" *ngIf="showShiftTemplates()">
      <div class="templates-modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">Shift Templates</h3>
            <p class="modal-subtitle">{{ selectedBusiness()?.name }}</p>
          </div>
          <button class="modal-close" (click)="closeShiftTemplates()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="!editingTemplate()">
            <div class="template-row" *ngFor="let t of businessTemplates()">
              <span class="template-dot" [style.background]="t.color"></span>
              <div class="template-info">
                <strong>{{ t.name }}</strong>
                <span>{{ t.scheduledStartTime }} - {{ t.scheduledEndTime }} • {{ getDaysString(t.daysOfWeek) }}</span>
              </div>
              <button class="action-icon-btn" (click)="editTemplate(t)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button class="action-icon-btn" (click)="deleteTemplate(t)" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div class="template-empty" *ngIf="!businessTemplates().length">
              <p>No shift templates yet for this business.</p>
            </div>
            <button class="btn-add-template" (click)="newTemplate()">
              + New Shift Template
            </button>
          </div>

          <div class="template-form" *ngIf="editingTemplate()">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" [(ngModel)]="templateForm().name" placeholder="e.g., Morning Shift">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Type</label>
                <select class="form-select" [(ngModel)]="templateForm().type">
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                  <option value="split">Split</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Color</label>
                <input type="color" class="form-input color-input" [(ngModel)]="templateForm().color">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time</label>
                <input type="time" class="form-input" [(ngModel)]="templateForm().scheduledStartTime">
              </div>
              <div class="form-group">
                <label class="form-label">End Time</label>
                <input type="time" class="form-input" [(ngModel)]="templateForm().scheduledEndTime">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Days of Week</label>
              <div class="days-selector">
                <label class="day-chip" *ngFor="let day of daysOfWeek" [class.active]="templateForm().daysOfWeek.includes(day.value)">
                  <input type="checkbox" [checked]="templateForm().daysOfWeek.includes(day.value)" (change)="toggleDay(day.value, $event)">
                  <span>{{ day.label }}</span>
                </label>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-secondary" (click)="cancelTemplateEdit()">Cancel</button>
              <button class="btn-primary" (click)="saveTemplate()" [disabled]="isSavingTemplate() || !templateForm().name">
                <span *ngIf="isSavingTemplate()" class="spinner"></span>
                {{ editingTemplate()?.id ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    .title-group { }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
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
    .stat-value { font-size: clamp(24px, 1.5vw + 20px, 28px); font-weight: 700; color: var(--on-surface); margin: 0; min-width: 0; word-break: break-word; }
    .stat-value--long { font-size: clamp(13px, 0.8vw + 11px, 15px); font-weight: 600; color: var(--secondary); line-height: 1.4; word-break: break-word; }
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
    .impersonate-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .impersonate-loader { background: var(--surface-container-lowest); border-radius: 16px; padding: 40px 48px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .impersonate-loader p { margin: 16px 0 0; font-size: 15px; color: var(--on-surface); }
    .spinner { width: 40px; height: 40px; margin: 0 auto; border: 3px solid var(--outline-variant); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .templates-modal { background: var(--surface-container-lowest); border-radius: 16px; padding: 24px; width: min(560px, 92vw); max-height: 84vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .modal-title { font-size: 18px; font-weight: 700; color: var(--on-surface); margin: 0 0 2px; }
    .modal-subtitle { font-size: 13px; color: var(--secondary); margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--secondary); padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: var(--surface-container-low); color: var(--on-surface); }
    .modal-body { display: flex; flex-direction: column; gap: 12px; }
    .template-row { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--outline-variant); border-radius: 10px; margin-bottom: 8px; }
    .template-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .template-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .template-info strong { font-size: 14px; color: var(--on-surface); }
    .template-info span { font-size: 12px; color: var(--secondary); }
    .template-empty { text-align: center; padding: 24px; color: var(--secondary); font-size: 14px; border: 1px dashed var(--outline-variant); border-radius: 10px; }
    .btn-add-template { width: 100%; padding: 12px; border: 1px dashed var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-add-template:hover { background: color-mix(in srgb, var(--primary) 15%, transparent); }
    .template-form { display: flex; flex-direction: column; gap: 12px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--on-surface); }
    .form-input, .form-select { padding: 10px 12px; border: 1px solid var(--outline-variant); border-radius: 8px; font-size: 14px; background: var(--surface-container-lowest); color: var(--on-surface); }
    .color-input { height: 42px; padding: 4px; }
    .days-selector { display: flex; flex-wrap: wrap; gap: 8px; }
    .day-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--outline-variant); cursor: pointer; font-size: 13px; color: var(--secondary); }
    .day-chip.active { background: color-mix(in srgb, var(--primary) 15%, transparent); border-color: var(--primary); color: var(--primary); }
    .day-chip input { display: none; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    .btn-secondary { padding: 10px 20px; border-radius: 9999px; border: 1px solid var(--outline-variant); background: transparent; color: var(--on-surface); font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary { padding: 10px 20px; border-radius: 9999px; border: none; background: var(--primary); color: var(--on-primary); font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .templates-modal .spinner { width: 16px; height: 16px; border-width: 2px; margin: 0 6px 0 0; display: inline-block; vertical-align: middle; }
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
  impersonatingId = signal<string | null>(null);

  showShiftTemplates = signal(false);
  selectedBusiness = signal<AdminBusiness | null>(null);
  businessTemplates = signal<ShiftTemplate[]>([]);
  editingTemplate = signal<ShiftTemplate | null>(null);
  isSavingTemplate = signal(false);

  templateForm = signal({
    name: '',
    type: 'morning' as ShiftType,
    scheduledStartTime: '07:00',
    scheduledEndTime: '15:00',
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    color: '#22c55e'
  });

  readonly daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

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
    const status = biz.subscriptionStatus ?? biz.subscription_status;
    return status ? status.toLowerCase() : 'expired';
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
    this.impersonatingId.set(biz.name);
    const branchId = biz.branches?.[0]?.id;
    this.authService.impersonate(biz.id, branchId, biz.name).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => this.impersonatingId.set(null),
    });
  }

  extendSubscription(biz: AdminBusiness) {
    const days = 30;
    this.adminApi.extendSubscription(biz.id, days).subscribe({
      next: () => {
        this.businesses.update(list =>
          list.map(b => b.id === biz.id ? { ...b, subscription_status: 'active', subscriptionStatus: 'active' } : b)
        );
      },
    });
  }

  // --- Shift Template Management (superadmin) ---

  openShiftTemplates(biz: AdminBusiness) {
    this.selectedBusiness.set(biz);
    this.showShiftTemplates.set(true);
    this.editingTemplate.set(null);
    this.loadBusinessTemplates(biz.id);
  }

  closeShiftTemplates() {
    this.showShiftTemplates.set(false);
    this.selectedBusiness.set(null);
    this.businessTemplates.set([]);
    this.editingTemplate.set(null);
  }

  private loadBusinessTemplates(businessId: string) {
    this.adminApi.listBusinessShiftTemplates(businessId).subscribe({
      next: (data) => this.businessTemplates.set(data || []),
      error: () => this.businessTemplates.set([]),
    });
  }

  newTemplate() {
    this.editingTemplate.set(null);
    this.templateForm.set({
      name: '',
      type: 'morning',
      scheduledStartTime: '07:00',
      scheduledEndTime: '15:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      color: '#22c55e'
    });
  }

  editTemplate(template: ShiftTemplate) {
    this.editingTemplate.set(template);
    this.templateForm.set({
      name: template.name,
      type: template.type,
      scheduledStartTime: template.scheduledStartTime,
      scheduledEndTime: template.scheduledEndTime,
      daysOfWeek: [...template.daysOfWeek],
      color: template.color
    });
  }

  cancelTemplateEdit() {
    this.editingTemplate.set(null);
  }

  saveTemplate() {
    const biz = this.selectedBusiness();
    if (!biz) return;
    const form = this.templateForm();
    if (!form.name.trim()) return;

    this.isSavingTemplate.set(true);
    const payload: CreateShiftTemplateRequest = {
      name: form.name,
      type: form.type,
      scheduledStartTime: form.scheduledStartTime,
      scheduledEndTime: form.scheduledEndTime,
      daysOfWeek: form.daysOfWeek,
      color: form.color
    };

    const request = this.editingTemplate()?.id
      ? this.adminApi.updateBusinessShiftTemplate(biz.id, this.editingTemplate()!.id!, payload)
      : this.adminApi.createBusinessShiftTemplate(biz.id, payload);

    request.subscribe({
      next: () => {
        this.isSavingTemplate.set(false);
        this.editingTemplate.set(null);
        this.loadBusinessTemplates(biz.id);
        Swal.fire({ icon: 'success', title: 'Shift template saved', timer: 1500, showConfirmButton: false });
      },
      error: (err: any) => {
        this.isSavingTemplate.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to save template', text: err?.error?.message || undefined });
      }
    });
  }

  deleteTemplate(template: ShiftTemplate) {
    const biz = this.selectedBusiness();
    if (!biz) return;
    Swal.fire({
      title: 'Delete Template?',
      text: `This will delete "${template.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminApi.deleteBusinessShiftTemplate(biz.id, template.id).subscribe({
          next: () => {
            this.loadBusinessTemplates(biz.id);
            Swal.fire({ icon: 'success', title: 'Template Deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to delete template' })
        });
      }
    });
  }

  toggleDay(dayValue: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.templateForm.update(f => ({
      ...f,
      daysOfWeek: checked
        ? [...f.daysOfWeek, dayValue]
        : f.daysOfWeek.filter(d => d !== dayValue)
    }));
  }

  getDaysString(days: number[]): string {
    if (!days?.length) return '—';
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Mon-Fri';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => this.daysOfWeek.find(w => w.value === d)?.label).join(', ');
  }
}
