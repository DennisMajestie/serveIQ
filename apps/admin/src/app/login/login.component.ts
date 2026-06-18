import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="onboarding-layout inter-font">
      <!-- Top Bar -->
      <header class="onboarding-topbar">
        <div class="brand">
          <svg class="brand-x" viewBox="0 0 14 14" fill="#F97316">
            <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5Z"/>
          </svg>
          <span class="brand-name space-font">ServeIQ</span>
        </div>
        <a href="#" class="topbar-support inter-font">Support</a>
      </header>

      <!-- Center Card -->
      <main class="onboarding-main">
        <div class="onboarding-card">

          <!-- Step Header -->
          <div class="step-meta">
            <span class="step-eyebrow">AUTHENTICATION</span>
            <div class="step-title-row">
              <h1 class="step-title space-font">Step 1/3: Account Access</h1>
              <span class="step-percent">10%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: 10%"></div>
            </div>
          </div>

          <!-- Form -->
          <form class="onboarding-form" (ngSubmit)="onSubmit()">
            
            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Address
              </label>
              <input type="email" class="form-input" [(ngModel)]="email" name="email" placeholder="name@business.com" required>
            </div>

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Password
              </label>
              <input type="password" class="form-input" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>

            <div class="form-row">
              <label class="checkbox-wrapper">
                <input type="checkbox" class="form-checkbox">
                <span class="checkbox-label">Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" class="btn-primary space-font" [disabled]="isLoading()">
              {{ isLoading() ? 'Signing in...' : 'Sign In to Dashboard' }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon" *ngIf="!isLoading()">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            <p class="login-link">New to ServeIQ? <a routerLink="/register">Create Account</a></p>
          </form>
        </div>
      </main>

      <!-- Bottom Features Strip -->
      <footer class="onboarding-footer">
        <div class="feature-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="feature-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Secure Access</span>
        </div>
        <div class="feature-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="feature-icon">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Live Monitoring</span>
        </div>
        <div class="feature-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="feature-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Data Protected</span>
        </div>
      </footer>

      <!-- Bottom Branding -->
      <div class="bottom-brand">
        <span class="space-font bottom-brand-text">ServeIQ</span>
        <div class="bottom-links inter-font">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <span class="copyright">© 2024 ServeIQ Technologies. All rights reserved.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .inter-font { font-family: 'Inter', sans-serif; }
    .space-font { font-family: 'Space Grotesk', sans-serif; }

    .onboarding-layout {
      min-height: 100vh; display: flex; flex-direction: column; align-items: center;
      background: #f4f6fa;
    }

    /* ===== TOP BAR ===== */
    .onboarding-topbar {
      width: 100%; max-width: 640px;
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px 16px; box-sizing: border-box;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-x { width: 18px; height: 18px; }
    .brand-name { font-weight: 800; font-size: 1.25rem; color: #0f172a; }
    .topbar-support { font-size: 0.875rem; font-weight: 600; color: #64748b; text-decoration: none; }

    /* ===== CARD ===== */
    .onboarding-main {
      flex: 1; display: flex; align-items: flex-start; justify-content: center;
      padding: 16px 16px 24px; width: 100%; box-sizing: border-box;
    }
    .onboarding-card {
      width: 100%; max-width: 480px; background: white; border-radius: 20px;
      padding: 40px; box-sizing: border-box;
      box-shadow: 0 4px 24px rgba(11, 28, 48, 0.06); border: 1.5px solid #f1f5f9;
    }

    /* ===== STEP META ===== */
    .step-meta { margin-bottom: 28px; }
    .step-eyebrow { font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em; color: #94a3b8; }
    .step-title-row { display: flex; justify-content: space-between; align-items: baseline; margin: 6px 0 12px; }
    .step-title { margin: 0; font-weight: 700; font-size: 1.25rem; color: #0f172a; }
    .step-percent { font-size: 0.875rem; font-weight: 800; color: #F97316; }
    .progress-track { height: 4px; background: #f1f5f9; border-radius: 2px; }
    .progress-fill { height: 100%; background: #F97316; border-radius: 2px; }

    /* ===== FORM ===== */
    .onboarding-form { display: flex; flex-direction: column; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .input-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.8125rem; font-weight: 700; color: #d97706;
    }
    .label-icon { width: 14px; height: 14px; flex-shrink: 0; }

    .form-input {
      display: block; width: 100%; box-sizing: border-box;
      padding: 13px 15px; border: 1.5px solid #e2e8f0; border-radius: 12px;
      font-size: 0.9375rem; font-family: 'Inter', sans-serif; color: #0f172a;
      background: white; transition: all 0.2s;
    }
    .form-input:focus {
      outline: none; border-color: #F97316;
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
    }

    .form-row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0; }
    .checkbox-wrapper { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .form-checkbox { width: 16px; height: 16px; border-radius: 4px; accent-color: #F97316; cursor: pointer; }
    .checkbox-label { font-size: 0.875rem; font-weight: 600; color: #64748b; }
    .forgot-link { font-size: 0.875rem; font-weight: 700; color: #d97706; text-decoration: none; }

    .btn-primary {
      width: 100%; padding: 17px;
      background: #F97316; color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 4px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.2); transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3); }
    .btn-icon { width: 20px; height: 20px; }

    .error-message { font-size: 0.8125rem; font-weight: 600; color: #ef4444; padding: 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fee2e2; }

    .login-link { margin: 0; text-align: center; font-size: 0.875rem; font-weight: 600; color: #64748b; }
    .login-link a { color: #d97706; text-decoration: none; font-weight: 700; }

    /* ===== FEATURES STRIP ===== */
    .onboarding-footer {
      display: flex; flex-wrap: wrap; gap: 24px 40px;
      justify-content: center; align-items: center;
      padding: 24px 16px;
    }
    .feature-item { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
    .feature-icon { width: 24px; height: 24px; color: #94a3b8; }

    /* ===== BOTTOM BRAND ===== */
    .bottom-brand {
      width: 100%; display: flex; flex-wrap: wrap; gap: 12px;
      justify-content: space-between; align-items: center;
      padding: 18px 32px; background: white; border-top: 1px solid #f1f5f9;
      box-sizing: border-box;
    }
    .bottom-brand-text { font-weight: 800; font-size: 1.125rem; color: #0f172a; }
    .bottom-links { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
    .bottom-links a { font-size: 0.8125rem; color: #64748b; text-decoration: none; font-weight: 600; }
    .copyright { font-size: 0.75rem; color: #94a3b8; }

    @media (max-width: 520px) {
      .onboarding-card { padding: 28px 20px; border-radius: 16px; }
      .step-title { font-size: 1.05rem; }
      .bottom-brand { flex-direction: column; align-items: flex-start; padding: 16px 20px; }
    }
  `]
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (!this.email() || !this.password()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please enter both email and password to access your dashboard.',
        confirmButtonColor: '#F97316'
      });
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: 'Establishing secure session...',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          iconColor: '#F97316'
        });
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: err.error?.message || 'Please check your credentials and try again.',
          confirmButtonColor: '#F97316'
        });
      }
    });
  }
}
