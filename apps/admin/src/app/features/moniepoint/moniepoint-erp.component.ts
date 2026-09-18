import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MoniepointErpApiService,
  MoniepointErpCredential,
  MoniepointErpPush,
  MoniepointErpPushStatus,
  MoniepointEnvironment,
} from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-moniepoint-erp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moniepoint-erp.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./moniepoint-erp.component.scss'],
})
export class MoniepointErpComponent implements OnInit {
  private erp = inject(MoniepointErpApiService);

  isLoading = signal(true);
  credential = signal<MoniepointErpCredential | null>(null);
  enrolled = computed(() => this.credential() !== null);

  showEnrollForm = signal(false);
  saving = signal(false);
  formClientId = signal('');
  formClientSecret = signal('');
  formEnvironment = signal<MoniepointEnvironment>('SANDBOX');
  envOptions: MoniepointEnvironment[] = ['SANDBOX', 'PROD'];

  pushes = signal<MoniepointErpPush[]>([]);
  pushesLoading = signal(true);
  statusFilter = signal<string>('');
  statusOptions: (MoniepointErpPushStatus | '')[] = [
    '',
    'pending',
    'paid',
    'declined',
    'expired',
    'cancelled',
  ];

  ngOnInit() {
    this.loadCredential();
    this.loadPushes();
  }

  loadCredential() {
    this.erp.getCredential().subscribe({
      next: (view) => {
        this.credential.set(view.credential);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load Credential Status' });
      },
    });
  }

  loadPushes() {
    this.pushesLoading.set(true);
    this.erp
      .listPushes({ status: (this.statusFilter() || undefined) as MoniepointErpPushStatus | undefined })
      .subscribe({
        next: (res) => {
          this.pushes.set(res.pushes ?? []);
          this.pushesLoading.set(false);
        },
        error: () => {
          this.pushesLoading.set(false);
          Swal.fire({ icon: 'error', title: 'Failed to Load Push History' });
        },
      });
  }

  openEnrollForm() {
    this.showEnrollForm.set(true);
  }

  closeEnrollForm() {
    if (this.saving()) return;
    this.showEnrollForm.set(false);
  }

  enroll() {
    const clientId = this.formClientId().trim();
    const clientSecret = this.formClientSecret().trim();
    if (!clientId || !clientSecret) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Client ID and client secret are required.',
      });
      return;
    }
    this.saving.set(true);
    this.erp
      .enroll({
        clientId,
        clientSecret,
        environment: this.formEnvironment(),
      })
      .subscribe({
        next: (view) => {
          this.saving.set(false);
          this.credential.set(view.credential);
          this.showEnrollForm.set(false);
          this.formClientId.set('');
          this.formClientSecret.set('');
          Swal.fire({
            icon: 'success',
            title: 'Credential Enrolled',
            text: 'This branch can now push payments to its POS terminals.',
          });
        },
        error: (err) => {
          this.saving.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Enrollment Failed',
            text: err?.serverMessage || err?.message || 'Could not enroll the credential.',
          });
        },
      });
  }

  rotateSecret() {
    Swal.fire({
      title: 'Rotate Client Secret',
      input: 'text',
      inputLabel: 'New Moniepoint client secret',
      inputPlaceholder: 'Paste the new client secret',
      showCancelButton: true,
      confirmButtonText: 'Rotate Secret',
      confirmButtonColor: '#F97316',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => (!value || !value.trim() ? 'Secret is required' : undefined),
    }).then((result) => {
      if (!result.isConfirmed) return;
      const secret = String(result.value ?? '').trim();
      this.erp.update({ clientSecret: secret }).subscribe({
        next: (view) => {
          this.credential.set(view.credential);
          Swal.fire({ icon: 'success', title: 'Secret Rotated' });
        },
        error: (err) =>
          Swal.fire({
            icon: 'error',
            title: 'Rotate Failed',
            text: err?.serverMessage || err?.message || 'Could not rotate the secret.',
          }),
      });
    });
  }

  setEnvironment(env: MoniepointEnvironment) {
    this.erp.update({ environment: env }).subscribe({
      next: (view) => {
        this.credential.set(view.credential);
        Swal.fire({
          icon: 'success',
          title: `Environment set to ${env}`,
        });
      },
      error: (err) =>
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err?.serverMessage || err?.message,
        }),
    });
  }

  toggleActive() {
    const next = !this.credential()?.isActive;
    this.erp.update({ isActive: next }).subscribe({
      next: (view) => {
        this.credential.set(view.credential);
      },
      error: (err) =>
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err?.serverMessage || err?.message,
        }),
    });
  }

  formatAmountKobo(kobo: number): string {
    return (kobo / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  }

  statusClass(status: MoniepointErpPushStatus | ''): string {
    switch (status) {
      case 'paid':
        return 'active';
      case 'pending':
        return 'pending';
      case 'declined':
      case 'expired':
        return 'declined';
      case 'cancelled':
        return 'inactive';
      default:
        return 'inactive';
    }
  }
}