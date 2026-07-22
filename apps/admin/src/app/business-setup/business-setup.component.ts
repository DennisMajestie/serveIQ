import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BranchesApiService, BusinessApiService, UserApiService } from '@serveiq/shared/data-access';
import { Business, Branch, CreateWaiterRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-business-setup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <main class="setup-container">
      <div class="setup-card">
        <div class="logo-area">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
          </div>
          <h1>Welcome to ServeIQ</h1>
          <p class="subtitle">Get your restaurant running in minutes</p>
        </div>

        <!-- Step indicator -->
        <div class="steps">
          <div class="step" [class.active]="currentStep() >= 1" [class.done]="currentStep() > 1">
            <span class="step-num">1</span>
            <span class="step-label">Business</span>
          </div>
          <div class="step-line" [class.done]="currentStep() > 1"></div>
          <div class="step" [class.active]="currentStep() >= 2" [class.done]="currentStep() > 2">
            <span class="step-num">2</span>
            <span class="step-label">Branch</span>
          </div>
          <div class="step-line" [class.done]="currentStep() > 2"></div>
          <div class="step" [class.active]="currentStep() >= 3" [class.done]="currentStep() > 3">
            <span class="step-num">3</span>
            <span class="step-label">Team</span>
          </div>
          <div class="step-line" [class.done]="currentStep() > 3"></div>
          <div class="step" [class.active]="currentStep() >= 4">
            <span class="step-num">4</span>
            <span class="step-label">Ready</span>
          </div>
        </div>

        <!-- Step 1: Business Profile -->
        <div *ngIf="currentStep() === 1" class="step-content">
          <h2>Business Profile</h2>
          <p class="step-desc">Confirm your business details</p>
          <div class="form-group">
            <label>Business Name</label>
            <input type="text" class="form-input" [value]="businessName()" (change)="businessName.set($any($event.target).value)" placeholder="My Restaurant">
          </div>
          <div class="form-group">
            <label>Business Type</label>
            <select class="form-input" [value]="businessType()" (change)="businessType.set($any($event.target).value)">
              <option value="restaurant">Restaurant</option>
              <option value="bar">Bar / Pub</option>
              <option value="cafe">Café</option>
              <option value="fast-food">Fast Food</option>
              <option value="bakery">Bakery</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Currency</label>
            <select class="form-input" [value]="currency()" (change)="currency.set($any($event.target).value)">
              <option value="NGN">NGN (₦) — Nigerian Naira</option>
              <option value="KES">KES (KSh) — Kenyan Shilling</option>
              <option value="GHS">GHS (GH₵) — Ghanaian Cedi</option>
              <option value="ZAR">ZAR (R) — South African Rand</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="EUR">EUR (€) — Euro</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveBusiness()" [disabled]="savingBusiness()">
              {{ savingBusiness() ? 'Saving...' : 'Continue' }}
            </button>
          </div>
        </div>

        <!-- Step 2: Create Branch -->
        <div *ngIf="currentStep() === 2" class="step-content">
          <h2>Your First Branch</h2>
          <p class="step-desc">Create your restaurant's first location</p>
          <div class="form-group">
            <label>Branch Name</label>
            <input type="text" class="form-input" [value]="branchName()" (change)="branchName.set($any($event.target).value)" placeholder="Main Branch">
          </div>
          <div class="form-group">
            <label>Address</label>
            <input type="text" class="form-input" [value]="branchAddress()" (change)="branchAddress.set($any($event.target).value)" placeholder="123 Restaurant Street">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" class="form-input" [value]="branchPhone()" (change)="branchPhone.set($any($event.target).value)" placeholder="+234 800 000 0000">
          </div>
          <div class="form-group">
            <label>Location (optional)</label>
            <input type="text" class="form-input" [value]="branchLocation()" (change)="branchLocation.set($any($event.target).value)" placeholder="Lagos, Nigeria">
          </div>
          <div class="form-actions">
            <button class="btn-ghost skip-btn" (click)="skipToDashboard()">Skip</button>
            <button class="btn-secondary" (click)="currentStep.set(1)">Back</button>
            <button class="btn-primary" (click)="createBranch()" [disabled]="savingBranch()">
              {{ savingBranch() ? 'Creating...' : 'Continue' }}
            </button>
          </div>
        </div>

        <!-- Step 3: Team Setup -->
        <div *ngIf="currentStep() === 3" class="step-content">
          <h2>Invite Your Team</h2>
          <p class="step-desc">Add staff members to get started</p>
          <div class="form-group">
            <label>Staff Name</label>
            <input type="text" class="form-input" [value]="staffName()" (change)="staffName.set($any($event.target).value)" placeholder="e.g. Jane Doe">
          </div>
          <div class="form-group">
            <label>Staff Email</label>
            <input type="email" class="form-input" [value]="staffEmail()" (change)="staffEmail.set($any($event.target).value)" placeholder="e.g. jane@example.com">
          </div>
          <div class="form-group">
            <label>Role</label>
            <select class="form-input" [value]="staffRole()" (change)="staffRole.set($any($event.target).value)">
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-ghost skip-btn" (click)="skipToDashboard()">Skip</button>
            <button class="btn-secondary" (click)="currentStep.set(2)">Back</button>
            <button class="btn-primary" (click)="inviteStaff()" [disabled]="invitingStaff()">
              {{ invitingStaff() ? 'Inviting...' : 'Invite' }}
            </button>
          </div>
        </div>

        <!-- Step 4: Ready -->
        <div *ngIf="currentStep() === 4" class="step-content done-step">
          <div class="done-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2>All Set!</h2>
          <p class="step-desc">Your business is ready to go.</p>
          <div class="bg-loading">
            <div class="loader"></div>
            <span>Finalizing account setup...</span>
          </div>
          <button class="btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .setup-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      padding: 24px;
    }
    .setup-card {
      background: var(--surface-container-lowest);
      border-radius: 24px;
      padding: 48px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    .logo-area {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 56px;
      height: 56px;
      background: var(--primary);
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      svg { width: 28px; height: 28px; color: white; }
    }
    h1 {
      margin: 0 0 8px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--on-surface);
    }
    .subtitle, .step-desc {
      margin: 0;
      color: var(--secondary);
      font-size: 0.9375rem;
    }
    .steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 36px;
      gap: 0;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .step-num {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      background: var(--surface-container-low);
      color: var(--secondary);
      transition: all 0.2s;
    }
    .step.active .step-num {
      background: var(--primary);
      color: var(--on-primary);
    }
    .step.done .step-num {
      background: #22c55e;
      color: white;
    }
    .step-label {
      font-size: 0.75rem;
      color: var(--secondary);
      font-weight: 600;
    }
    .step.active .step-label { color: var(--on-surface); }
    .step.done .step-label { color: #22c55e; }
    .step-line {
      width: 48px;
      height: 2px;
      background: var(--surface-container-low);
      margin: 0 8px;
      margin-bottom: 24px;
    }
    .step-line.done { background: #22c55e; }
    .step-content { margin-top: 8px; }
    .step-content h2 {
      margin: 0 0 4px;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--on-surface);
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid var(--outline-variant);
      border-radius: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 0.9375rem;
      color: var(--on-surface);
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
      &:focus { border-color: var(--primary); }
    }
    select.form-input { appearance: auto; }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
    }
    .btn-primary, .btn-secondary, .btn-ghost {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.15s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary {
      background: var(--primary);
      color: var(--on-primary);
      &:hover:not(:disabled) { filter: brightness(0.9); }
    }
    .btn-secondary {
      background: var(--surface-container-low);
      color: var(--secondary);
      &:hover:not(:disabled) { background: var(--surface-container-high); }
    }
    .btn-ghost {
      background: transparent;
      color: var(--secondary);
      border: 1px solid var(--outline-variant);
      &:hover:not(:disabled) { background: var(--surface-container-low); }
    }
    .skip-btn {
      flex: 0.5;
    }
    .done-step {
      text-align: center;
      padding: 24px 0;
    }
    .done-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: color-mix(in srgb, #22c55e 15%, transparent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      svg { width: 32px; height: 32px; }
    }
    .bg-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 20px 0;
      font-size: 0.8125rem;
      color: var(--secondary);
    }
    .loader {
      width: 18px;
      height: 18px;
      border: 2px solid var(--outline-variant);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .done-step .btn-primary { max-width: 240px; margin: 24px auto 0; }
    @media (max-width: 480px) {
      .setup-card { padding: 32px 24px; }
      .step-line { width: 32px; }
    }
  `]
})
export class BusinessSetupComponent implements OnInit {
  private businessApi = inject(BusinessApiService);
  private branchesApi = inject(BranchesApiService);
  private userApi = inject(UserApiService);
  private router = inject(Router);

  currentStep = signal(1);
  savingBusiness = signal(false);
  savingBranch = signal(false);
  invitingStaff = signal(false);

  businessName = signal('');
  businessType = signal('restaurant');
  currency = signal('NGN');

  branchName = signal('');
  branchAddress = signal('');
  branchPhone = signal('');
  branchLocation = signal('');

  staffName = signal('');
  staffEmail = signal('');
  staffRole = signal('waiter');

  ngOnInit() {
    this.businessApi.getBusiness().subscribe({
      next: (b) => {
        this.businessName.set(b.name || '');
        this.businessType.set(b.type || 'restaurant');
        this.currency.set(b.currency || 'NGN');
      },
      error: () => {}
    });
    this.branchesApi.list().subscribe({
      next: (branches) => {
        if (branches.length > 0) {
          this.currentStep.set(4);
        }
      },
      error: () => {}
    });
  }

  saveBusiness() {
    if (!this.businessName().trim()) return;
    this.savingBusiness.set(true);
    this.businessApi.updateBusiness({
      name: this.businessName().trim(),
      type: this.businessType(),
      currency: this.currency(),
    } as any).subscribe({
      next: () => {
        this.savingBusiness.set(false);
        this.currentStep.set(2);
      },
      error: () => {
        this.savingBusiness.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to save business settings' });
      }
    });
  }

  createBranch() {
    if (!this.branchName().trim() || !this.branchAddress().trim()) {
      Swal.fire({ icon: 'warning', title: 'Branch name and address are required' });
      return;
    }
    this.savingBranch.set(true);
    this.branchesApi.create({
      name: this.branchName().trim(),
      address: this.branchAddress().trim(),
      phone_number: this.branchPhone().trim(),
      location: this.branchLocation().trim() || undefined,
    }).subscribe({
      next: (branch) => {
        localStorage.setItem('branchId', branch.id);
        localStorage.setItem('branchName', branch.name);
        this.savingBranch.set(false);
        this.currentStep.set(3);
      },
      error: () => {
        this.savingBranch.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to create branch' });
      }
    });
  }

  inviteStaff() {
    if (!this.staffName().trim() || !this.staffEmail().trim()) {
      Swal.fire({ icon: 'warning', title: 'Staff name and email are required' });
      return;
    }
    const branchId = localStorage.getItem('branchId');
    if (!branchId) {
      Swal.fire({ icon: 'warning', title: 'No branch found. Create a branch first.' });
      return;
    }
    this.invitingStaff.set(true);
    this.userApi.createWaiter({
      fullName: this.staffName().trim(),
      email: this.staffEmail().trim(),
      role: this.staffRole() as 'waiter' | 'supervisor',
      branchId,
    }).subscribe({
      next: () => {
        this.invitingStaff.set(false);
        this.currentStep.set(4);
      },
      error: () => {
        this.invitingStaff.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to invite staff' });
      }
    });
  }

  skipToDashboard() {
    this.router.navigate(['/app/dashboard']);
  }

  goToDashboard() {
    this.router.navigate(['/app/dashboard']);
  }
}
