import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminPaymentProvider } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-payment-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Payment Providers</h1>
            <p class="page-subtitle">Platform-wide payment providers available to every business.<br>Define providers once here; branches enable and configure their own keys in Settings.</p>
          </div>
          <button class="btn-primary" (click)="openCreate()">
            <span class="material-symbols-outlined">add</span>
            New Provider
          </button>
        </div>
      </header>

      <section class="table-card">
        <div class="table-header">
          <h2>All Providers</h2>
          <span class="showing-count" *ngIf="providers().length">{{ providers().length }} configured</span>
        </div>

        <div class="table-wrapper" *ngIf="!isLoading()">
          <table class="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Type</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row" *ngFor="let p of providers(); trackBy: trackById">
                <td class="cell-name">
                  <div class="biz-info">
                    <span class="biz-name">{{ p.label }}</span>
                    <span class="biz-email">{{ p.name }}</span>
                  </div>
                </td>
                <td><span class="type-pill">{{ typeLabel(p) }}</span></td>
                <td><span class="verify-pill">{{ verificationLabel(p) }}</span></td>
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
              <tr *ngIf="!providers().length">
                <td colspan="5" class="empty-state">No payment providers yet. Click "New Provider" to add one.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="loading-state" *ngIf="isLoading()">
          <p>Loading providers...</p>
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
    .type-pill, .verify-pill { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--surface-container-low); color: var(--secondary); text-transform: capitalize; }
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
export class PaymentProvidersComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  providers = signal<AdminPaymentProvider[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.load();
  }

  trackById(_: number, p: AdminPaymentProvider): string {
    return p.id;
  }

  private load() {
    this.isLoading.set(true);
    this.adminApi.listPaymentProviders().subscribe({
      next: (list) => {
        const rows = Array.isArray(list) ? list : [];
        this.providers.set(rows);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  typeLabel(p: AdminPaymentProvider): string {
    return p.type === 'webhook' ? 'Webhook' : 'Manual';
  }

  verificationLabel(p: AdminPaymentProvider): string {
    const method = p.verificationMethod || p.verification_method;
    if (!method || method === 'none') return '—';
    return method.toUpperCase();
  }

  private formHtml(values?: AdminPaymentProvider): string {
    return `
      <div class="text-left space-y-3">
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Provider Key (unique)</label>
          <input id="ppName" class="swal2-input" value="${values ? values.name : ''}" placeholder="e.g. stripe, paystack" ${values ? 'readonly' : ''} />
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Display Label</label>
          <input id="ppLabel" class="swal2-input" value="${values ? values.label : ''}" placeholder="e.g. Stripe" />
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Type</label>
          <select id="ppType" class="swal2-input">
            <option value="manual" ${values && values.type === 'manual' ? 'selected' : ''}>Manual</option>
            <option value="webhook" ${values && values.type === 'webhook' ? 'selected' : ''}>Webhook</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-[var(--on-surface-variant)] mb-1">Verification Method</label>
          <select id="ppVerify" class="swal2-input">
            <option value="none" ${!values || !values.verificationMethod || values.verificationMethod === 'none' ? 'selected' : ''}>None</option>
            <option value="hmac-sha512" ${values && values.verificationMethod === 'hmac-sha512' ? 'selected' : ''}>HMAC-SHA512</option>
            <option value="rsa" ${values && values.verificationMethod === 'rsa' ? 'selected' : ''}>RSA</option>
          </select>
        </div>
      </div>
    `;
  }

  private parseForm(): { name: string; label: string; type: 'manual' | 'webhook'; verification_method?: 'hmac-sha512' | 'rsa' | 'none' } {
    const name = (document.getElementById('ppName') as HTMLInputElement)?.value.trim();
    const label = (document.getElementById('ppLabel') as HTMLInputElement)?.value.trim();
    const rawType = (document.getElementById('ppType') as HTMLSelectElement)?.value;
    const rawVerify = (document.getElementById('ppVerify') as HTMLSelectElement)?.value || 'none';
    let verification_method: 'hmac-sha512' | 'rsa' | 'none' | undefined;
    if (rawVerify === 'hmac-sha512' || rawVerify === 'rsa') verification_method = rawVerify;
    return { name, label, type: rawType === 'webhook' ? 'webhook' : 'manual', verification_method };
  }

  openCreate() {
    Swal.fire({
      title: 'New Payment Provider',
      html: this.formHtml(),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Provider',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const input = this.parseForm();
        if (!input.name || !input.label) {
          Swal.showValidationMessage('Name and label are required');
          return false;
        }
        return input;
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      const input = result.value;
      this.adminApi.createPaymentProvider(input).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Provider Created', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Create Failed' }),
      });
    });
  }

  edit(p: AdminPaymentProvider) {
    Swal.fire({
      title: 'Edit Payment Provider',
      html: this.formHtml(p),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const input = this.parseForm();
        if (!input.label) {
          Swal.showValidationMessage('Label is required');
          return false;
        }
        return input;
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      const input = result.value;
      this.adminApi.updatePaymentProvider(p.id, {
        label: input.label,
        type: input.type,
        verification_method: input.verification_method,
      }).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Provider Updated', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Update Failed' }),
      });
    });
  }

  toggleActive(p: AdminPaymentProvider) {
    this.adminApi.updatePaymentProvider(p.id, { is_active: !p.isActive }).subscribe({
      next: () => this.load(),
      error: () => Swal.fire({ icon: 'error', title: 'Update Failed' }),
    });
  }

  remove(p: AdminPaymentProvider) {
    Swal.fire({
      title: 'Delete provider?',
      text: `"${p.label}" will be removed from the platform. Branches that configured it keep their keys but it will no longer be available for new branches.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.adminApi.deletePaymentProvider(p.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Provider Deleted', timer: 1200, showConfirmButton: false });
          this.load();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' }),
      });
    });
  }
}
