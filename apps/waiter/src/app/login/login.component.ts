import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserApiService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // State
  pin = signal<string>('');
  pinError = signal<boolean>(false);
  isActivated = signal<boolean>(false);
  businessName = signal<string>('');
  
  // Login Form
  adminEmail = '';
  adminPassword = '';
  isActivating = signal(false);

  private authService = inject(AuthService);
  private userService = inject(UserApiService);
  private router = inject(Router);

  ngOnInit() {
    const bizId = localStorage.getItem('businessId');
    const bizName = localStorage.getItem('businessName');
    
    if (bizId) {
      this.isActivated.set(true);
      this.businessName.set(bizName || 'ServeIQ Business');
    }
  }

  onActivateTerminal() {
    if (!this.adminEmail || !this.adminPassword) return;
    
    this.isActivating.set(true);
    this.authService.login(this.adminEmail, this.adminPassword).subscribe({
      next: (res: any) => {
        this.isActivated.set(true);
        this.businessName.set(res.data?.businessName || res.data?.business?.name || 'ServeIQ Business');
        this.isActivating.set(false);
        Swal.fire({ icon: 'success', title: 'Terminal Linked', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        this.isActivating.set(false);
        const msg = err.error?.meta?.message?.[0] || 'Invalid credentials';
        Swal.fire({ icon: 'error', title: 'Login Failed', text: msg });
      }
    });
  }

  onPinSubmit() {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) return;

    this.authService.verifyStaffPin(this.pin(), businessId).subscribe({
      next: () => {
        this.router.navigate(['/tables']);
      },
      error: (err) => {
        this.pinError.set(true);
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Invalid PIN',
          showConfirmButton: false,
          timer: 2000,
          background: '#1e293b',
          color: '#ef4444'
        });

        setTimeout(() => {
          this.pin.set('');
          this.pinError.set(false);
        }, 800);
      }
    });
  }

  onDigit(digit: string) {
    if (this.pin().length < 4) {
      this.pin.set(this.pin() + digit);
      this.pinError.set(false);

      if (this.pin().length === 4) {
        this.onPinSubmit();
      }
    }
  }

  clearPin() {
    this.pin.set('');
  }

  resetActivation() {
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    this.isActivated.set(false);
  }

  callManager() {
    Swal.fire({
      title: 'Manager Called',
      html: `
        <div style="margin: 16px 0;">
          <span class="material-symbols-outlined" style="font-size: 48px; color: #4be277;">support_agent</span>
        </div>
        <p style="color: #aaa; margin: 0; font-size: 14px;">
          A manager has been notified. Please wait at your station.
        </p>
      `,
      timer: 3000,
      showConfirmButton: false,
      background: '#1e293b',
      color: '#fff',
      customClass: { popup: 'swal-glass' }
    });
  }

  viewRoster() {
    this.userService.listWaiters().subscribe({
      next: (waiters) => {
        const rows = waiters.map(w => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-weight: 600; font-size: 14px; color: #fff;">${w.fullName || 'Unknown'}</div>
              <div style="font-size: 12px; color: #888; margin-top: 2px;">${w.email || ''}</div>
            </div>
            <span style="font-size: 12px; font-weight: 500; color: #4be277; text-transform: uppercase; letter-spacing: 0.05em;">${w.role || 'staff'}</span>
          </div>
        `).join('');

        Swal.fire({
          title: 'Staff Roster',
          html: `<div style="max-height: 320px; overflow-y: auto;">${rows || '<div style="color: #888; text-align: center; padding: 16px;">No staff found</div>'}</div>`,
          confirmButtonText: 'Close',
          confirmButtonColor: '#4be277',
          background: '#1e293b',
          color: '#fff',
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load',
          text: 'Could not load staff roster. Please try again.',
          confirmButtonColor: '#4be277',
          background: '#1e293b',
          color: '#fff',
        });
      }
    });
  }
}
