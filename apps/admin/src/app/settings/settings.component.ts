import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService, AuthService, UserApiService, BusinessApiService } from '@serveiq/shared/data-access';
import { Branch, User, CreateBranchRequest, Business } from '@serveiq/shared/models';
import Swal from 'sweetalert2';



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
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  copiedBranchId = signal<string | null>(null);
  isEmailVerified = signal(false);
  otp = signal('');
  showOtpInput = signal(false);
  isSendingOtp = signal(false);
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
  businessSettings = signal<Business | null>(null);
  taxRate = signal<number | null>(null);
  currency = signal('NGN');
  timezone = signal('Africa/Lagos');
  isSavingSettings = signal(false);

  ngOnInit() {
    this.loadProfile();
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(Array.isArray(b) ? b : []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
    this.loadBusinessSettings();
  }

  loadBusinessSettings() {
    this.businessApi.getBusiness().subscribe({
      next: (b) => {
        this.businessSettings.set(b);
        this.taxRate.set(b.taxRate ?? null);
        this.currency.set(b.currency || 'NGN');
        this.timezone.set(b.timezone || 'Africa/Lagos');
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

  copyBranchId(branchId: string) {
    navigator.clipboard.writeText(branchId);
    this.copiedBranchId.set(branchId);
    setTimeout(() => this.copiedBranchId.set(null), 2000);
  }

  isCopied(branchId: string): boolean {
    return this.copiedBranchId() === branchId;
  }

  sendVerification() {
    this.isSendingOtp.set(true);
    this.authService.sendVerification().subscribe({
      next: () => {
        this.isSendingOtp.set(false);
        this.showOtpInput.set(true);
        Swal.fire({ icon: 'success', title: 'OTP Sent', text: 'Check your email for the verification code.', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isSendingOtp.set(false);
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not send verification email.', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  verifyOtp() {
    if (!this.otp()) return;
    this.authService.verifyEmail({ otp: this.otp() }).subscribe({
      next: () => {
        this.isEmailVerified.set(true);
        this.showOtpInput.set(false);
        this.otp.set('');
        Swal.fire({ icon: 'success', title: 'Email Verified', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Verification Failed', text: 'Invalid or expired OTP.', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }
}
