import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PosApiService,
  MoniepointErpApiService,
  MoniepointErpCredential,
  MoniepointErpPush,
  MoniepointErpPushStatus,
  MoniepointEnvironment,
  BranchesApiService,
  PlatformPaymentProviderSummary,
} from '@serveiq/shared/data-access';
import { PermissionService } from '../../core/permission.service';
import Swal from 'sweetalert2';

interface PosTerminal {
  id: string;
  label: string;
  isActive: boolean;
  serialNumber?: string;
  accountNumber?: string;
}

interface PaymentProviderConfig {
  name: string;
  type: 'manual' | 'webhook';
  label: string;
  verification_method?: 'hmac-sha512' | 'rsa' | 'none';
  config: Record<string, string>;
}

type PosSection =
  | 'terminals'
  | 'moniepoint'
  | 'payment-webhooks'
  | 'takeaway-policy';

@Component({
  selector: 'app-pos-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-management.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pos-management.component.scss'],
})
export class PosManagementComponent implements OnInit {
  private posApi = inject(PosApiService);
  private erp = inject(MoniepointErpApiService);
  private branchesApi = inject(BranchesApiService);
  private permService = inject(PermissionService);

  // ─────────────────────────────────────────────────────────────
  // SIDEBAR / NAVIGATION
  // ─────────────────────────────────────────────────────────────
  activeSection = signal<PosSection>('terminals');
  readonly showMoniepoint = computed(() =>
    this.permService.hasPermission('payment_gateway')
  );
  readonly navItems = computed<
    { key: PosSection; label: string; icon: string }[]
  >(() => {
    const items: { key: PosSection; label: string; icon: string }[] = [
      { key: 'terminals', label: 'POS Terminals', icon: 'point_of_sale' },
    ];
    if (this.showMoniepoint()) {
      items.push({
        key: 'moniepoint',
        label: 'Moniepoint ERP',
        icon: 'account_balance_wallet',
      });
    }
    items.push(
      {
        key: 'payment-webhooks',
        label: 'Payment & Webhooks',
        icon: 'sync_alt',
      },
      {
        key: 'takeaway-policy',
        label: 'Takeaway Policy',
        icon: 'restaurant',
      }
    );
    return items;
  });
  setActiveSection(section: PosSection) {
    this.activeSection.set(section);
  }

  // ─────────────────────────────────────────────────────────────
  // POS TERMINALS
  // ─────────────────────────────────────────────────────────────
  isLoading = signal(true);
  terminals = signal<PosTerminal[]>([]);
  showModal = signal(false);
  editingTerminal = signal<PosTerminal | null>(null);
  formLabel = signal('');
  formActive = signal(true);
  formAccountNumber = signal('');
  formSerial = signal('');

  ngOnInit() {
    this.loadTerminals();
    this.loadCredential();
    this.loadPushes();
    this.branchesApi.list().subscribe({
      next: (b) => {
        this.branches.set(Array.isArray(b) ? b : []);
        if (this.branches().length) {
          this.setActiveBranchId(
            localStorage.getItem('activeBranchId') || this.branches()[0].id
          );
        }
      },
      error: () => undefined,
    });
  }

  loadTerminals() {
    this.isLoading.set(true);
    this.posApi.getAll().subscribe({
      next: (data) => {
        this.terminals.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load Terminals' });
      },
    });
  }

  openAddModal() {
    this.editingTerminal.set(null);
    this.formLabel.set('');
    this.formActive.set(true);
    this.formAccountNumber.set('');
    this.formSerial.set('');
    this.showModal.set(true);
  }

  editTerminal(t: PosTerminal) {
    this.editingTerminal.set(t);
    this.formLabel.set(t.label);
    this.formActive.set(t.isActive);
    this.formAccountNumber.set(t.accountNumber || '');
    this.formSerial.set(t.serialNumber || '');
    this.showModal.set(true);
  }

  saveTerminal() {
    const body: any = { label: this.formLabel(), is_active: this.formActive() };
    if (this.formAccountNumber()) body.account_number = this.formAccountNumber();
    if (this.formSerial()) body.serial_number = this.formSerial();
    const obs = this.editingTerminal()
      ? this.posApi.update(this.editingTerminal()!.id, body)
      : this.posApi.create(body);
    obs.subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadTerminals();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Save Failed' }),
    });
  }

  deleteTerminal(id: string) {
    Swal.fire({
      title: 'Delete POS Terminal?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.posApi.remove(id).subscribe({
          next: () => this.loadTerminals(),
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' }),
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MONIEPOINT ERP
  // ─────────────────────────────────────────────────────────────
  monieLoading = signal(true);
  credential = signal<MoniepointErpCredential | null>(null);
  enrolled = computed(() => this.credential() !== null);

  showEnrollForm = signal(false);
  mpSaving = signal(false);
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

  loadCredential() {
    this.erp.getCredential().subscribe({
      next: (view) => {
        this.credential.set(view.credential);
        this.monieLoading.set(false);
      },
      error: () => {
        this.monieLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Credential Status',
        });
      },
    });
  }

  loadPushes() {
    this.pushesLoading.set(true);
    this.erp
      .listPushes({
        status: (this.statusFilter() || undefined) as
          | MoniepointErpPushStatus
          | undefined,
      })
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
    if (this.mpSaving()) return;
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
    this.mpSaving.set(true);
    this.erp
      .enroll({
        clientId,
        clientSecret,
        environment: this.formEnvironment(),
      })
      .subscribe({
        next: (view) => {
          this.mpSaving.set(false);
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
          this.mpSaving.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Enrollment Failed',
            text:
              err?.serverMessage ||
              err?.message ||
              'Could not enroll the credential.',
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
      cancelButtonColor: '#6b7280',
      inputValidator: (value) =>
        !value || !value.trim() ? 'Secret is required' : undefined,
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
            text:
              err?.serverMessage ||
              err?.message ||
              'Could not rotate the secret.',
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

  toggleMpActive() {
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

  // ─────────────────────────────────────────────────────────────
  // PAYMENT & WEBHOOKS / TAKEAWAY POLICY
  // ─────────────────────────────────────────────────────────────
  branches = signal<{ id: string; name: string }[]>([]);
  activeBranchId = signal('');
  setActiveBranchId(id: string) {
    this.activeBranchId.set(id || '');
    localStorage.setItem('activeBranchId', id || '');
    this.loadPaymentSettings();
  }

  // Payment settings
  platformProviders = signal<PlatformPaymentProviderSummary[]>([]);
  isLoadingPlatform = signal(false);
  takeawayPolicy = signal<'prepay' | 'pay_on_pickup'>('prepay');

  /** Providers the owner has selected (multi). 'manual' is always on. */
  enabledProviders = signal<string[]>(['manual']);
  paymentProviders = signal<PaymentProviderConfig[]>([]);
  isSavingPayment = signal(false);

  /** Webhook providers currently enabled and saved with their secrets. */
  readonly enabledWebhookProviders = computed(() =>
    this.paymentProviders().filter(
      (p) => p.type === 'webhook' && this.enabledProviders().includes(p.name)
    )
  );

  /** Whether every enabled webhook provider has its secret/key stored. */
  readonly autoConfirmReady = computed(() =>
    this.enabledWebhookProviders().every((p) => this.isProvConfigured(p))
  );

  readonly enabledTransferAccounts = computed(() =>
    this.enabledWebhookProviders()
      .map((p) => ({ label: p.label, account: this.provAccount(p) }))
      .filter((e) => !!e.account)
  );

  isProvConfigured(provider?: PaymentProviderConfig | null): boolean {
    if (!provider) return false;
    const config = provider.config || {};
    if (provider.type === 'webhook') {
      if (provider.verification_method === 'rsa') {
        return !!(config['public_key'] || config['publicKey']);
      }
      return !!(config['webhook_secret'] || config['secret']);
    }
    return true;
  }

  provAccount(provider?: PaymentProviderConfig | null): string | null {
    if (!provider) return null;
    const config = provider.config || {};
    return config['account_number'] || null;
  }

  toggleProvider(name: string, checked: boolean) {
    const current = this.enabledProviders();
    if (checked && !current.includes(name)) {
      this.enabledProviders.set([...current, name]);
    } else if (!checked) {
      this.enabledProviders.set(current.filter((n) => n !== name));
    }
  }

  providerConfigValue(provider: PaymentProviderConfig, key: string): string {
    return provider.config[key] || '';
  }

  setProviderConfig(
    provider: PaymentProviderConfig,
    key: string,
    value: string
  ) {
    provider.config[key] = value;
    this.paymentProviders.set([...this.paymentProviders()]);
  }

  loadPaymentSettings() {
    const branchId = this.activeBranchId() || this.branches()[0]?.id || '';
    if (!branchId) {
      this.enabledProviders.set(['manual']);
      return;
    }
    this.activeBranchId.set(branchId);
    this.branchesApi.getById(branchId).subscribe({
      next: (branch: any) => {
        const settings = branch.settings || {};
        this.takeawayPolicy.set(
          settings.takeaway_payment_policy || 'prepay'
        );
        const storedProviders: PaymentProviderConfig[] = Array.isArray(
          settings.payment_providers
        )
          ? settings.payment_providers
          : [];
        const migrated = this.migrateLegacyEnabled(
          settings,
          storedProviders
        );
        this.loadPlatformProviders(migrated);
      },
      error: () => undefined,
    });
  }

  /** Builds the stored provider list, honoring the legacy single-select
   *  `payment_provider` / `monniepoint_webhook_secret` fields if the new
   *  `enabled_providers` array is not present yet. */
  private migrateLegacyEnabled(
    settings: any,
    storedProviders: PaymentProviderConfig[]
  ): PaymentProviderConfig[] {
    const manual: PaymentProviderConfig = {
      name: 'manual',
      type: 'manual',
      label: 'Manual',
      config: {},
    };
    const providers = storedProviders.length ? storedProviders : [manual];

    // Legacy secrets stored flat — fold them into config if present.
    if (settings.monniepoint_webhook_secret) {
      const mp = providers.find((p) => p.name === 'monniepoint');
      if (mp) {
        if (!mp.config) mp.config = {};
        mp.config['webhook_secret'] = settings.monniepoint_webhook_secret;
      }
    }
    if (settings.opay_public_key) {
      const op = providers.find((p) => p.name === 'opay');
      if (op) {
        if (!op.config) op.config = {};
        op.config['public_key'] = settings.opay_public_key;
      }
    }

    const enabledFromLegacy: string[] = Array.isArray(
      settings.enabled_providers
    )
      ? settings.enabled_providers
      : settings.payment_provider && settings.payment_provider !== 'manual'
        ? [settings.payment_provider]
        : [];
    this.enabledProviders.set(['manual', ...enabledFromLegacy]);
    return providers;
  }

  private loadPlatformProviders(existing: PaymentProviderConfig[]) {
    this.isLoadingPlatform.set(true);
    this.branchesApi.getPlatformPaymentProviders().subscribe({
      next: (platform: any) => {
        const list = Array.isArray(platform) ? platform : [];
        const merged = [...existing];
        for (const gp of list) {
          if (!merged.some((p) => p.name === gp.name)) {
            merged.push({
              name: gp.name,
              type: gp.type,
              label: gp.label,
              verification_method:
                gp.verificationMethod || gp.verification_method,
              config: {},
            });
          }
        }
        this.paymentProviders.set(merged);
        const existingNames = new Set(merged.map((p) => p.name));
        this.enabledProviders.set(
          this.enabledProviders().filter((n) => existingNames.has(n))
        );
        this.isLoadingPlatform.set(false);
      },
      error: () => this.isLoadingPlatform.set(false),
    });
  }

  savePaymentSettings() {
    const branchId = this.activeBranchId();
    if (!branchId) return;
    this.isSavingPayment.set(true);
    const enabled = this.enabledProviders();
    const persisted = this.paymentProviders().map((p) => ({
      ...p,
      config: { ...(p.config || {}) },
    }));
    this.branchesApi
      .updateSettings(branchId, {
        settings: {
          payment_provider: enabled.find((n) => n !== 'manual') || 'manual',
          enabled_providers: enabled,
          payment_providers: persisted,
          takeaway_payment_policy: this.takeawayPolicy(),
        },
      } as any)
      .subscribe({
        next: () => {
          this.isSavingPayment.set(false);
          Swal.fire({
            icon: 'success',
            title: 'Payment Settings Saved',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: () => {
          this.isSavingPayment.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Failed to save payment settings',
          });
        },
      });
  }
}
