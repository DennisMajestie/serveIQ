import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="onboarding-layout inter-font">
      <header class="onboarding-topbar">
        <div class="brand">
          <svg class="brand-x" viewBox="0 0 14 14" fill="#F97316">
            <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5Z"/>
          </svg>
          <span class="brand-name space-font">ServeIQ</span>
        </div>
      </header>

      <main class="onboarding-main">
        <div class="onboarding-card">
          <div class="step-meta">
            <span class="step-eyebrow">AUTHENTICATION</span>
            <div class="step-title-row">
              <h1 class="step-title space-font">Reset Password</h1>
            </div>
            <p class="step-description inter-font">Enter your new password below.</p>
          </div>

          <form class="onboarding-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="input-label">New Password</label>
              <input
                type="password"
                class="form-input"
                [(ngModel)]="password"
                name="password"
                placeholder="Min. 8 characters"
                required
                minlength="8"
              />
            </div>

            <div class="form-group">
              <label class="input-label">Confirm Password</label>
              <input
                type="password"
                class="form-input"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter password"
                required
              />
            </div>

            <button type="submit" class="btn-primary space-font" [disabled]="isLoading() || !token()">
              {{ isLoading() ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .onboarding-layout {
      min-height: 100vh;
      background: linear-gradient(135deg, #0b1c30 0%, #1a2a44 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .onboarding-topbar {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      display: flex;
      align-items: center;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-x { width: 20px; height: 20px; }
    .brand-name { font-size: 1.25rem; color: #fff; }
    .onboarding-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      width: 100%;
      max-width: 480px;
    }
    .onboarding-card {
      background: #1e293b;
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .step-meta { margin-bottom: 24px; }
    .step-eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      color: #F97316;
      letter-spacing: 0.05em;
    }
    .step-title {
      font-size: 1.75rem;
      color: #fff;
      margin: 8px 0;
    }
    .step-description {
      color: #94a3b8;
      font-size: 0.875rem;
      margin: 0;
    }
    .onboarding-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .form-input {
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #334155;
      background: #0f172a;
      color: #fff;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus { border-color: #F97316; }
    .btn-primary {
      padding: 14px 24px;
      background: #F97316;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
      margin-top: 8px;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ResetPasswordComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token = signal<string>('');
  password = '';
  confirmPassword = '';
  isLoading = signal(false);

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      this.token.set(params.get('token') || '');
    });
  }

  onSubmit() {
    if (!this.password || this.password.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Password too short', text: 'Must be at least 8 characters', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      return;
    }
    if (this.password !== this.confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords do not match', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword({ token: this.token(), password: this.password }).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Password Reset', text: 'You can now log in with your new password.', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Reset Failed', text: err.error?.message || 'Invalid or expired token', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }
}
