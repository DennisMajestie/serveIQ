import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsApiService, AdminPlan, CreatePlanPayload, AdminBillingInterval } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'];
const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Subscription Plans</h1>
            <p class="page-subtitle">Platform-wide subscription tiers offered to businesses on the billing page.<br>Prices are entered in the plan's currency; display price converts automatically.</p>
          </div>
          <button class="btn-primary" (click)="openCreate()">
            <span class="material-symbols-outlined">add</span>
            New Plan
          </button>
        </div>
      </header>

      <section class="table-card">
        <div class="table-header">
          <h2>All Plans</h2>
          <span class="showing-count" *ngIf="plans().length">{{ plans().length }} configured</span>
        </div>

        <div class="table-wrapper" *ngIf="!isLoading()">
          <table class="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Interval</th>
                <th>Limits</th>
                <th>Paystack Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row" *ngFor="let p of plans(); trackBy: trackById">
                <td class="cell-name">
                  <div class="biz-info">
                    <span class="biz-name">{{ p.name }}</span>
                    <span class="biz-email">{{ p.id }}</span>
                  </div>
                </td>
                <td><span class="price-text">{{ formatPrice(p) }}</span></td>
                <td><span class="type-pill">{{ intervalLabel(p.billingInterval) }}</span></td>
                <td>
                  <span class="limit-text" *ngIf="limits(p); else noLimits">{{ limits(p) }}</span>
                  <ng-template #noLimits><span class="limit-text muted">—</span></ng-template>
                </td>
                <td><span class="biz-email">{{ p.paystackPlanCode || '—' }}</span></td>
                <td>
                  <span class="status-badge" [class.active]="p.isActive" [class.inactive]="!p.isActive">
                    {{ p.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="action-icon-btn" (click)="toggleActive(p)" [title]="p.isActive ? 'Deactivate' : 'Activate'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <circle cx="12" cy="12" r="10"/>
                      <path *ngIf="p.isActive" d="m4.93 4.93 14.14 14.14"/>
                      <path *ngIf="!p.isActive" d="M12 2a10 10 0 0 1 0 20"/>
                    </svg>
                  </button>
                  <button class="action-icon-btn" (click)="edit(p)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                  </button>
                  <button class="action-icon-btn action-danger" (click)="remove(p)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!plans().length">
                <td colspan="7" class="empty-state">No plans yet. Click "New Plan" to create one.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="loading-state" *ngIf="isLoading()">
          <p>Loading plans...</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; line-height: 1.4; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--primary); color: var(--on-primary); border: none; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn-primary:hover { opacity: 0.9; }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid var(--outline-variant); }
    .table-header h2 { font-size: 16px; font-weight: 700; color: var(--on-surface); margin: 0; }
    .showing-count { font-size: 13px; color: var(--secondary); white-space: nowrap; }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline-variant); }
    .data-table td { padding: 14px 16px; font-size: 14px; color: var(--secondary); border-bottom: 1px solid var(--outline-variant); }
    .data-row:hover { background: var(--surface-container-low); }
    .biz-info { display: flex; flex-direction: column; gap: 2px; }
    .biz-name { font-weight: 600; color: var(--on-surface); }
    .biz-email { font-size: 12px; color: var(--secondary); font-family: monospace; }
    .price-text { font-weight: 600; color: var(--on-surface); }
    .type-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--surface-container-low); color: var(--secondary); text-transform: capitalize; }
    .limit-text { font-size: 13px; color: var(--secondary); }
    .limit-text.muted { color: var(--outline); }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
    .status-badge.inactive { background: var(--error-container); color: var(--on-error-container); }
    .cell-actions { text-align: right; white-space: nowrap; }
    .action-icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: var(--secondary); transition: all 0.15s; }
    .action-icon-btn:hover { background: var(--surface-container-low); color: var(--primary); }
    .action-icon-btn.action-danger:hover { color: #ef4444; }
    .empty-state { text-align: center; padding: 48px; color: var(--secondary); font-size: 14px; }
    .loading-state { text-align: center; padding: 48px; color: var(--secondary); }
  `]
})
export class PlansComponent implements OnInit {
  private subApi = inject(SubscriptionsApiService);

  plans = signal<AdminPlan[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.load();
  }

  trackById(_: number, p: AdminPlan): string {
    return p.id;
  }

  private load() {
    this.isLoading.set(true);
    this.subApi.getAllPlans().subscribe({
      next: (list) => {
        const rows = Array.isArray(list) ? list : [];
        this.plans.set(rows);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  intervalLabel(interval: string): string {
    return interval === 'yearly' ? 'Yearly' : 'Monthly';
  }

  limits(p: AdminPlan): string {
    const f: Record<string, any> = p.features || {};
    const parts: string[] = [];
    if (f['maxTables'] != null) parts.push(`${f['maxTables']} tables`);
    if (f['maxWaiters'] != null) parts.push(`${f['maxWaiters']} staff`);
    if (f['reportingEnabled'] != null) parts.push(f['reportingEnabled'] ? 'reports' : 'no reports');
    return parts.join(' · ');
  }

  formatPrice(p: AdminPlan): string {
    const code = p.currency || 'NGN';
    if (p.price === 0) return `Free · ${code}`;
    const symbol = CURRENCY_SYMBOLS[code] || '';
    const value = (p.price / 100).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol}${value} ${code}`;
  }

  private formHtml(values?: AdminPlan): string {
    const currency = values?.currency || 'NGN';
    const interval = values?.billingInterval || 'monthly';
    const majorPrice = values ? (values.price / 100).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    const features: Record<string, any> = values?.features || {};
    const maxTables = features['maxTables'] != null ? features['maxTables'] : '';
    const maxWaiters = features['maxWaiters'] != null ? features['maxWaiters'] : '';
    const currencyOptions = CURRENCIES
      .map(c => `<option value="${c}" ${c === currency ? 'selected' : ''}>${c}</option>`)
      .join('');
    return `
      <div class="text-left space-y-3">
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Plan Name</label>
          <input id="plName" class="swal2-input" value="${values ? values.name : ''}" placeholder="e.g. Pro" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Price</label>
            <input id="plPrice" class="swal2-input" inputmode="decimal" value="${majorPrice}" placeholder="e.g. 35000.00" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Currency</label>
            <select id="plCurrency" class="swal2-input">${currencyOptions}</select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Billing Interval</label>
          <select id="plInterval" class="swal2-input">
            <option value="monthly" ${interval === 'monthly' ? 'selected' : ''}>Monthly</option>
            <option value="yearly" ${interval === 'yearly' ? 'selected' : ''}>Yearly</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Max Tables</label>
            <input id="plTables" class="swal2-input" inputmode="numeric" value="${maxTables}" placeholder="e.g. 20" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Max Staff</label>
            <input id="plWaiters" class="swal2-input" inputmode="numeric" value="${maxWaiters}" placeholder="e.g. 15" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Paystack Plan Code</label>
          <input id="plCode" class="swal2-input" value="${values?.paystackPlanCode || ''}" placeholder="e.g. PLN_abc123 (optional)" />
        </div>
        <div class="flex items-center gap-2">
          <input id="plActive" type="checkbox" ${!values || values.isActive ? 'checked' : ''} />
          <label for="plActive" class="text-sm text-[var(--on-surface-variant)]">Active and available for purchase</label>
        </div>
      </div>
    `;
  }

  private parseForm(): { name: string; price: number; currency: string; billing_interval: AdminBillingInterval; features: Record<string, any>; is_active: boolean; paystack_plan_code?: string } {
    const name = (document.getElementById('plName') as HTMLInputElement)?.value.trim();
    const priceMajor = (document.getElementById('plPrice') as HTMLInputElement)?.value.trim();
    const currency = (document.getElementById('plCurrency') as HTMLSelectElement)?.value || 'NGN';
    const rawInterval = (document.getElementById('plInterval') as HTMLSelectElement)?.value;
    const rawTables = (document.getElementById('plTables') as HTMLInputElement)?.value.trim();
    const rawWaiters = (document.getElementById('plWaiters') as HTMLInputElement)?.value.trim();
    const code = (document.getElementById('plCode') as HTMLInputElement)?.value.trim();
    const isActive = (document.getElementById('plActive') as HTMLInputElement)?.checked ?? true;

    const price = priceMajor ? Math.round(parseFloat(priceMajor) * 100) : 0;
    const features: Record<string, any> = {
      maxTables: rawTables ? parseInt(rawTables, 10) : 0,
      maxWaiters: rawWaiters ? parseInt(rawWaiters, 10) : 0,
      reportingEnabled: true,
    };
    return {
      name,
      price,
      currency,
      billing_interval: rawInterval === 'yearly' ? 'yearly' : 'monthly',
      features,
      is_active: isActive,
      paystack_plan_code: code || undefined,
    };
  }

  openCreate() {
    Swal.fire({
      title: 'New Subscription Plan',
      html: this.formHtml(),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Plan',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const input = this.parseForm();
        if (!input.name) {
          Swal.showValidationMessage('Plan name is required');
          return false;
        }
        if (isNaN(input.price) || input.price < 0) {
          Swal.showValidationMessage('Enter a valid price (0 for free)');
          return false;
        }
        return input;
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      const input: CreatePlanPayload = result.value;
      this.subApi.createPlan(input).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Plan Created', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Create Failed', text: err?.error?.message || undefined }),
      });
    });
  }

  edit(p: AdminPlan) {
    Swal.fire({
      title: 'Edit Subscription Plan',
      html: this.formHtml(p),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const input = this.parseForm();
        if (!input.name) {
          Swal.showValidationMessage('Plan name is required');
          return false;
        }
        return input;
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      const input = result.value;
      const payload = {
        name: input.name,
        price: input.price,
        currency: input.currency,
        billing_interval: input.billing_interval,
        features: input.features,
        paystack_plan_code: input.paystack_plan_code,
      };
      this.subApi.updatePlan(p.id, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Plan Updated', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Update Failed', text: err?.error?.message || undefined }),
      });
    });
  }

  toggleActive(p: AdminPlan) {
    this.subApi.togglePlanActive(p.id).subscribe({
      next: () => this.load(),
      error: () => Swal.fire({ icon: 'error', title: 'Update Failed' }),
    });
  }

  remove(p: AdminPlan) {
    Swal.fire({
      title: 'Delete plan?',
      text: `"${p.name}" (${p.currency}) will be removed. Active subscriptions on this plan will be affected.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.subApi.deletePlan(p.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Plan Deleted', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' }),
      });
    });
  }
}
