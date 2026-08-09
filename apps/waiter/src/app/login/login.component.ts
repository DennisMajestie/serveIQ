import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserApiService, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // State
  pin = signal<string>('');
  pinError = signal<boolean>(false);
  businessName = signal(localStorage.getItem('businessName') || '');
  isResolved = signal(!!localStorage.getItem('businessId'));
  businessCode = '';
  isResolving = signal(false);

  private authService = inject(AuthService);
  private userService = inject(UserApiService);
  private router = inject(Router);
  private env = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);

  onResolveBusiness() {
    if (!this.businessCode.trim()) return;
    this.isResolving.set(true);
    this.authService.resolveBusinessCode(this.businessCode.trim().toUpperCase()).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        const businessId = data.business_id || data.businessId;
        const businessName = data.business_name || data.businessName || 'ServeIQ';
        if (businessId) {
          localStorage.setItem('businessId', businessId);
          localStorage.setItem('businessName', businessName);
          this.businessName.set(businessName);
          this.isResolved.set(true);
          this.isResolving.set(false);
        } else {
          this.isResolving.set(false);
          Swal.fire({ icon: 'error', title: 'Invalid Code', text: 'Could not resolve business. Please check the code.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
        }
      },
      error: () => {
        this.isResolving.set(false);
        Swal.fire({ icon: 'error', title: 'Invalid Code', text: 'Business code not found. Please check and try again.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      }
    });
  }

  onPinSubmit() {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) return;

    this.authService.verifyStaffPin(this.pin(), businessId).subscribe({
      next: () => {
        const role = (localStorage.getItem('userRole') || '').toLowerCase();
        if (role === 'supervisor') {
          this.router.navigate(['/supervisor/orders']);
        } else if (role === 'chef') {
          this.router.navigate(['/chef']);
        } else if (role === 'manager') {
          const adminUrl = (this.env.adminBaseUrl || this.env.publicMenuBaseUrl).replace(/\/+$/, '');
          const staffToken = localStorage.getItem('staffToken');
          window.location.assign(`${adminUrl}/login?token=${encodeURIComponent(staffToken || '')}&role=${encodeURIComponent(role)}`);
        } else {
          this.router.navigate(['/tables']);
        }
      },
      error: () => {
        this.pinError.set(true);
        Swal.fire({
          toast: true, position: 'top-end', icon: 'error', title: 'Invalid PIN',
          showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#ef4444'
        });
        setTimeout(() => { this.pin.set(''); this.pinError.set(false); }, 800);
      }
    });
  }

  onDigit(digit: string) {
    if (this.pin().length < 4) {
      this.pin.set(this.pin() + digit);
      this.pinError.set(false);
      if (this.pin().length === 4) this.onPinSubmit();
    }
  }

  clearPin() {
    this.pin.set('');
  }

  resetBusiness() {
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessName');
    this.isResolved.set(false);
    this.pin.set('');
  }

  callManager() {
    Swal.fire({
      title: 'Manager Called',
      html: `<div style="margin:16px 0;"><span class="material-symbols-outlined" style="font-size:48px;color:#4be277;">support_agent</span></div><p style="color:#aaa;margin:0;font-size:14px;">A manager has been notified. Please wait at your station.</p>`,
      timer: 3000, showConfirmButton: false, background: '#1e293b', color: '#fff',
      customClass: { popup: 'swal-glass' }
    });
  }

  viewRoster() {
    this.userService.listWaiters().subscribe({
      next: (waiters) => {
        const arr = Array.isArray(waiters) ? waiters : [];
        const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);
        const rows = arr.map(w => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><div><div style="font-weight:600;font-size:14px;color:#fff;">${esc(w.fullName || 'Unknown')}</div><div style="font-size:12px;color:#888;margin-top:2px;">${esc(w.email || '')}</div></div><span style="font-size:12px;font-weight:500;color:#4be277;text-transform:uppercase;letter-spacing:0.05em;">${esc(w.role || 'staff')}</span></div>`).join('');
        Swal.fire({
          title: 'Staff Roster',
          html: `<div style="max-height:320px;overflow-y:auto;">${rows || '<div style="color:#888;text-align:center;padding:16px;">No staff found</div>'}</div>`,
          confirmButtonText: 'Close', confirmButtonColor: '#4be277', background: '#1e293b', color: '#fff',
        });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to Load', text: 'Could not load staff roster.', confirmButtonColor: '#4be277', background: '#1e293b', color: '#fff' })
    });
  }
}
