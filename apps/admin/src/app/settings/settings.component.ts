import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService, AuthService } from '@serveiq/shared/data-access';
import { Branch } from '@serveiq/shared/models';
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
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  copiedBranchId = signal<string | null>(null);
  isEmailVerified = signal(false);
  otp = signal('');
  showOtpInput = signal(false);
  isSendingOtp = signal(false);

  ngOnInit() {
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(b); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
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
