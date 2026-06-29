import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService, AuthService, UserApiService, BusinessApiService, UploadApiService } from '@serveiq/shared/data-access';
import { Branch, User, Business } from '@serveiq/shared/models';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

type Section = 'branch-setup' | 'branding' | 'staff' | 'security' | 'verification';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private branchesApi = inject(BranchesApiService);
  private authService = inject(AuthService);
  private userApi = inject(UserApiService);
  private businessApi = inject(BusinessApiService);
  private uploadService = inject(UploadApiService);
  activeSection = signal<Section>('branch-setup');
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  copiedBranchId = signal<string | null>(null);
  isEmailVerified = signal(false);
  profileName = signal('');
  profileEmail = signal('');
  isUpdatingProfile = signal(false);
  showBranchModal = signal(false);
  editingBranch = signal<Branch | null>(null);
  branchFormName = signal('');
  branchFormAddress = signal('');
  branchFormPhone = signal('');
  branchFormLocation = signal('');
  isSavingBranch = signal(false);
  activeBranchId = signal(localStorage.getItem('activeBranchId') || '');
  businessSettings = signal<Business | null>(null);
  taxRate = signal<number | null>(null);
  currency = signal('NGN');
  timezone = signal('Africa/Lagos');
  isSavingSettings = signal(false);
  brandPrimaryColor = signal('#F97316');
  brandAccentColor = signal('#d97706');
  brandLogoPreview = signal<string | null>(null);
  brandLogoFile = signal<File | null>(null);
  isSavingBranding = signal(false);

  // Staff Management
  waiters = signal<User[]>([]);
  isLoadingWaiters = signal(false);
  showCreateWaiterModal = signal(false);
  waiterFormName = signal('');
  waiterFormEmail = signal('');
  waiterFormPhone = signal('');
  waiterFormBranchId = signal('');
  isSavingWaiter = signal(false);

  // Security
  newPassword = signal('');
  confirmPassword = signal('');
  isUpdatingPassword = signal(false);

  // Email Verification
  verificationCode = signal('');
  showCodeInput = signal(false);
  isSendingCode = signal(false);

  ngOnInit() {
    this.loadProfile();
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(Array.isArray(b) ? b : []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
    this.loadBusinessSettings();
    this.loadWaiters();
  }

  loadBusinessSettings() {
    this.businessApi.getBusiness().subscribe({
      next: (b) => {
        this.businessSettings.set(b);
        this.taxRate.set(b.taxRate ?? null);
        this.currency.set(b.currency || 'NGN');
        this.timezone.set(b.timezone || 'Africa/Lagos');
        this.brandPrimaryColor.set(b.brandPrimaryColor || '#F97316');
        this.brandAccentColor.set(b.brandAccentColor || '#d97706');
      }
    });
  }

  saveBusinessSettings() {
    this.isSavingSettings.set(true);
    this.businessApi.updateBusiness({
      taxRate: this.taxRate(),
      currency: this.currency(),
      timezone: this.timezone(),
    } as any).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        Swal.fire({ icon: 'success', title: 'Settings Saved', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isSavingSettings.set(false);
        Swal.fire({ icon: 'error', title: 'Save Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  setActiveSection(section: Section) {
    this.activeSection.set(section);
  }

  onBrandLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.brandLogoFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.brandLogoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async saveBranding() {
    this.isSavingBranding.set(true);
    let logoUrl = this.businessSettings()?.logoUrl;
    if (this.brandLogoFile()) {
      try {
        const uploaded = await firstValueFrom(this.uploadService.uploadFile(this.brandLogoFile()!));
        logoUrl = uploaded?.url;
      } catch { /* silently skip photo */ }
    }
    this.businessApi.updateBusiness({
      logoUrl,
      brandPrimaryColor: this.brandPrimaryColor(),
      brandAccentColor: this.brandAccentColor(),
    } as any).subscribe({
      next: () => {
        this.isSavingBranding.set(false);
        this.brandLogoFile.set(null);
        Swal.fire({ icon: 'success', title: 'Branding Saved', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isSavingBranding.set(false);
        Swal.fire({ icon: 'error', title: 'Save Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  loadProfile() {
    this.userApi.getMe().subscribe({
      next: (user: any) => {
        this.profileName.set(user.fullName || '');
        this.profileEmail.set(user.email || '');
      }
    });
  }

  updateProfile() {
    if (!this.profileName()) return;
    this.isUpdatingProfile.set(true);
    this.userApi.updateMe({ fullName: this.profileName() } as any).subscribe({
      next: () => {
        this.isUpdatingProfile.set(false);
        Swal.fire({ icon: 'success', title: 'Profile Updated', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isUpdatingProfile.set(false);
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  showCreateBranch() {
    this.editingBranch.set(null);
    this.branchFormName.set('');
    this.branchFormAddress.set('');
    this.branchFormPhone.set('');
    this.branchFormLocation.set('');
    this.showBranchModal.set(true);
  }

  showEditBranch(branch: Branch) {
    this.editingBranch.set(branch);
    this.branchFormName.set(branch.name);
    this.branchFormAddress.set(branch.address);
    this.branchFormPhone.set(branch.phoneNumber);
    this.branchFormLocation.set(branch.location || '');
    this.showBranchModal.set(true);
  }

  saveBranch() {
    if (!this.branchFormName()) return;
    this.isSavingBranch.set(true);
    const payload = {
      name: this.branchFormName(),
      address: this.branchFormAddress(),
      phone_number: this.branchFormPhone(),
      location: this.branchFormLocation(),
    };
    const request = this.editingBranch()
      ? this.branchesApi.update(this.editingBranch()!.id, payload)
      : this.branchesApi.create(payload);
    request.subscribe({
      next: () => {
        this.isSavingBranch.set(false);
        this.showBranchModal.set(false);
        Swal.fire({ icon: 'success', title: this.editingBranch() ? 'Branch Updated' : 'Branch Created', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
        this.branchesApi.list().subscribe(b => this.branches.set(Array.isArray(b) ? b : []));
      },
      error: () => {
        this.isSavingBranch.set(false);
        Swal.fire({ icon: 'error', title: 'Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  deleteBranch(branch: Branch) {
    Swal.fire({
      title: 'Delete Branch?',
      text: `Permanently delete ${branch.name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      background: '#1e293b',
      color: '#fff',
    }).then(result => {
      if (result.isConfirmed) {
        this.branchesApi.removeBranch(branch.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Branch Deleted', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
            this.branchesApi.list().subscribe(b => this.branches.set(Array.isArray(b) ? b : []));
          },
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  setActiveBranch(branchId: string) {
    this.activeBranchId.set(branchId);
    localStorage.setItem('activeBranchId', branchId);
  }

  copyBranchId(branchId: string) {
    navigator.clipboard.writeText(branchId);
    this.copiedBranchId.set(branchId);
    setTimeout(() => this.copiedBranchId.set(null), 2000);
  }

  isCopied(branchId: string): boolean {
    return this.copiedBranchId() === branchId;
  }

  getInitials(name: string | undefined | null): string {
    if (!name) return '?';
    return name.split(' ').filter(n => !!n).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ===== Staff Management =====

  loadWaiters() {
    this.isLoadingWaiters.set(true);
    this.userApi.listWaiters().subscribe({
      next: (w) => {
        this.waiters.set(Array.isArray(w) ? w : []);
        this.isLoadingWaiters.set(false);
      },
      error: () => this.isLoadingWaiters.set(false)
    });
  }

  showCreateWaiter() {
    this.waiterFormName.set('');
    this.waiterFormEmail.set('');
    this.waiterFormPhone.set('');
    this.waiterFormBranchId.set(this.activeBranchId() || this.branches()[0]?.id || '');
    this.showCreateWaiterModal.set(true);
  }

  createWaiter() {
    if (!this.waiterFormName() || !this.waiterFormBranchId()) return;
    this.isSavingWaiter.set(true);
    this.userApi.createWaiter({
      fullName: this.waiterFormName(),
      email: this.waiterFormEmail() || undefined,
      phone: this.waiterFormPhone() || undefined,
      branchId: this.waiterFormBranchId(),
    }).subscribe({
      next: (waiter) => {
        this.isSavingWaiter.set(false);
        this.showCreateWaiterModal.set(false);
        Swal.fire({
          icon: 'success', title: 'Waiter Created',
          text: waiter.pin ? `PIN: ${waiter.pin}` : undefined,
          timer: waiter.pin ? 5000 : 1500, showConfirmButton: false,
          background: '#1e293b', color: '#fff'
        });
        this.loadWaiters();
      },
      error: () => {
        this.isSavingWaiter.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to create waiter', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  resetWaiterPin(waiter: User) {
    Swal.fire({
      title: 'Reset PIN?',
      text: `Reset PIN for ${waiter.fullName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#F97316',
      cancelButtonColor: '#6b7280',
      background: '#1e293b', color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.userApi.resetStaffPin(waiter.id, '').subscribe({
        next: (res: any) => {
          const pin = res?.pin || '0000';
          Swal.fire({
            icon: 'success', title: 'PIN Reset',
            text: `New PIN for ${waiter.fullName}: ${pin}`,
            timer: 8000, showConfirmButton: false,
            background: '#1e293b', color: '#fff'
          });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Reset Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
      });
    });
  }

  deactivateWaiter(waiter: User) {
    const label = waiter.isActive === false ? 'Activate' : 'Deactivate';
    Swal.fire({
      title: `${label} ${waiter.fullName}?`,
      text: waiter.isActive === false ? 'They will regain access.' : 'They will lose access until reactivated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: label,
      confirmButtonColor: waiter.isActive === false ? '#22c55e' : '#dc2626',
      cancelButtonColor: '#6b7280',
      background: '#1e293b', color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.userApi.deactivateUser(waiter.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: `${waiter.fullName} ${label}d`, timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
          this.loadWaiters();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
      });
    });
  }

  // ===== Security (Password) =====

  updatePassword() {
    const pw = this.newPassword();
    const confirm = this.confirmPassword();
    if (!pw || pw.length < 8) {
      Swal.fire({ icon: 'error', title: 'Password must be at least 8 characters', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      return;
    }
    if (pw !== confirm) {
      Swal.fire({ icon: 'error', title: 'Passwords do not match', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      return;
    }
    this.isUpdatingPassword.set(true);
    this.userApi.updateMe({ password: pw } as any).subscribe({
      next: () => {
        this.isUpdatingPassword.set(false);
        this.newPassword.set('');
        this.confirmPassword.set('');
        Swal.fire({ icon: 'success', title: 'Password Updated', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isUpdatingPassword.set(false);
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  // ===== Email Verification =====

  sendVerificationCode() {
    this.isSendingCode.set(true);
    this.authService.sendVerification().subscribe({
      next: () => {
        this.isSendingCode.set(false);
        this.showCodeInput.set(true);
        Swal.fire({ icon: 'success', title: 'Code Sent', text: 'Check your email for the verification code.', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isSendingCode.set(false);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not send verification email.', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  verifyEmailCode() {
    if (!this.verificationCode()) return;
    this.authService.verifyEmail({ otp: this.verificationCode() }).subscribe({
      next: () => {
        this.isEmailVerified.set(true);
        this.showCodeInput.set(false);
        this.verificationCode.set('');
        Swal.fire({ icon: 'success', title: 'Email Verified', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Verification Failed', text: 'Invalid or expired code.', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }
}
