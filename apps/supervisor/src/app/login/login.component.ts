import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand">
          <div class="logo-icon">
            <span class="material-symbols-outlined">supervisor_account</span>
          </div>
          <h1>Supervisor Access</h1>
          <p class="subtitle">ServeIQ — {{ businessName() }}</p>
        </div>

        @if (!isActivated()) {
          <div class="activate-section">
            <p class="activate-hint">Link this device to your business to begin.</p>
            <input
              type="email"
              [(ngModel)]="adminEmail"
              placeholder="Owner/Manager email"
              class="field-input"
              autocomplete="email"
            />
            <input
              type="password"
              [(ngModel)]="adminPassword"
              placeholder="Password"
              class="field-input"
              autocomplete="current-password"
            />
            <button
              class="btn btn-primary btn-full"
              (click)="onActivateTerminal()"
              [disabled]="isActivating() || !adminEmail || !adminPassword"
            >
              {{ isActivating() ? 'Linking...' : 'Link Device' }}
            </button>
          </div>
        } @else {
          <div class="pin-section">
            <p class="pin-label">Enter your PIN</p>
            <div class="pin-dots">
              @for (i of [0,1,2,3]; track i) {
                <div class="pin-dot" [class.filled]="i < pin().length" [class.error]="pinError()"></div>
              }
            </div>
            <div class="numpad">
              @for (digit of ['1','2','3','4','5','6','7','8','9','','0','⌫']; track digit) {
                @if (digit === '') {
                  <div class="numpad-key empty"></div>
                } @else if (digit === '⌫') {
                  <button class="numpad-key action" (click)="clearPin()">
                    <span class="material-symbols-outlined">backspace</span>
                  </button>
                } @else {
                  <button class="numpad-key" (click)="onDigit(digit)">{{ digit }}</button>
                }
              }
            </div>
            <button class="link-btn" (click)="resetActivation()">
              <span class="material-symbols-outlined">settings</span> Change Business
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .material-symbols-outlined { font-size: 24px; vertical-align: middle; }

    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: var(--background);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--outline-variant);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }

    .brand {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: var(--primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .logo-icon .material-symbols-outlined {
      font-size: 32px;
      color: var(--on-primary-container);
    }

    .brand h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--on-surface);
    }

    .subtitle {
      font-size: 13px;
      color: var(--secondary);
      margin: 0;
    }

    .activate-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activate-hint {
      font-size: 13px;
      color: var(--secondary);
      margin: 0 0 4px;
      text-align: center;
    }

    .field-input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--outline-variant);
      background: var(--surface-container-low);
      color: var(--on-surface);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field-input:focus {
      border-color: var(--primary-container);
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 48px;
      border-radius: 12px;
      border: none;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-primary {
      background: var(--primary-container);
      color: var(--on-primary-container);
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-full { width: 100%; }

    .pin-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .pin-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--on-surface);
      margin: 0;
    }

    .pin-dots {
      display: flex;
      gap: 14px;
    }

    .pin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid var(--outline-variant);
      background: transparent;
      transition: all 0.2s;
    }
    .pin-dot.filled {
      background: var(--primary-container);
      border-color: var(--primary-container);
    }
    .pin-dot.error {
      border-color: var(--error);
      background: var(--error);
    }

    .numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
      max-width: 260px;
    }

    .numpad-key {
      height: 56px;
      border-radius: 14px;
      border: 1px solid var(--outline-variant);
      background: var(--surface-container-low);
      color: var(--on-surface);
      font-size: 22px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      font-family: inherit;
    }
    .numpad-key:hover { background: var(--surface-container-high); }
    .numpad-key:active { transform: scale(0.93); }
    .numpad-key.empty { background: transparent; border-color: transparent; cursor: default; }
    .numpad-key.action { border-color: transparent; background: transparent; color: var(--secondary); font-size: 18px; }
    .numpad-key.action:hover { background: var(--surface-container-low); }

    .link-btn {
      background: none;
      border: none;
      color: var(--secondary);
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
      padding: 8px;
    }
    .link-btn:hover { color: var(--primary-container); }
  `]
})
export class LoginComponent implements OnInit {
  pin = signal<string>('');
  pinError = signal<boolean>(false);
  isActivated = signal<boolean>(false);
  businessName = signal(localStorage.getItem('businessName') || 'ServeIQ');

  adminEmail = '';
  adminPassword = '';
  isActivating = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private env = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);

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
    this.authService.activateTerminal(this.adminEmail, this.adminPassword).subscribe({
      next: (res: any) => {
        this.isActivated.set(true);
        this.businessName.set(res.data?.businessName || res.data?.business?.name || 'ServeIQ Business');
        this.isActivating.set(false);
        Swal.fire({ icon: 'success', title: 'Device Linked', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
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
      next: (res: any) => {
        const role = (res?.data?.user?.role || res?.data?.role || localStorage.getItem('userRole') || '').toString().toLowerCase();
        if (role === 'supervisor') {
          this.router.navigate(['/orders']);
        } else {
          Swal.fire({ icon: 'error', title: 'Access Denied', text: 'This app is for supervisors only.', background: '#1A1A1A', color: '#fff' });
          this.authService.logout();
        }
      },
      error: () => {
        this.pinError.set(true);
        Swal.fire({
          toast: true, position: 'top-end', icon: 'error',
          title: 'Invalid PIN', showConfirmButton: false, timer: 2000,
          background: '#1e293b', color: '#ef4444'
        });
        setTimeout(() => { this.pin.set(''); this.pinError.set(false); }, 800);
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
}
