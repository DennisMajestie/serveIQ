import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@serveiq/shared/data-access';
import { NemotronService } from '../nemotron.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-business',
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
            <span class="step-eyebrow">ONBOARDING</span>
            <div class="step-title-row">
              <h1 class="step-title space-font">Step 2/3: Business Setup</h1>
              <span class="step-percent">66%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: 66%"></div>
            </div>
          </div>

          <!-- Form -->
          <form class="onboarding-form" (ngSubmit)="onSubmit()">

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Business Name
              </label>
              <input type="text" class="form-input" [(ngModel)]="businessName" name="businessName" placeholder="e.g. The Golden Bistro" (ngModelChange)="onInfoChange()" required>
            </div>

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                Business Type
              </label>
              <div class="select-wrapper">
                <select class="form-select" [(ngModel)]="businessType" name="businessType" (ngModelChange)="onInfoChange()" required>
                  <option value="">Select business type</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar & Lounge</option>
                  <option value="cafe">Café</option>
                  <option value="fastfood">Fast Food</option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Full Name
              </label>
              <input type="text" class="form-input" [(ngModel)]="fullName" name="fullName" placeholder="e.g. John Doe" required>
            </div>

            <!-- AI Reasoning Section (Harness Nemotron) -->
            <div class="nemotron-reasoning" *ngIf="isThinking() || suggestions()">
              <div class="reasoning-header">
                <svg viewBox="0 0 24 24" fill="#F97316" class="ai-icon">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17" stroke="#F97316" stroke-width="2"/>
                </svg>
                <span class="reasoning-label space-font">Nemotron Intelligence</span>
                <span class="thinking-loader" *ngIf="isThinking()"></span>
              </div>
              
              <div class="reasoning-bubble" *ngIf="reasoning()">
                <div class="reasoning-content inter-font">{{ reasoning() }}</div>
              </div>

              <div class="suggestions-box" *ngIf="suggestions()">
                <div class="suggestions-content inter-font">{{ suggestions() }}</div>
              </div>
            </div>

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

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Business Logo
              </label>
              <div class="file-upload-wrapper">
                <input type="file" class="file-input" accept="image/*" (change)="onLogoSelected($event)" [disabled]="isUploadingLogo()" #logoInput>
                <div class="file-upload-info" *ngIf="logoFile(); else logoPlaceholder">
                  <span class="file-name">{{ logoFile()?.name }}</span>
                  <div class="upload-progress" *ngIf="isUploadingLogo()">
                    <div class="progress-bar" [style.width.%]="logoUploadProgress()"></div>
                    <span class="progress-text">Uploading... {{ logoUploadProgress() }}%</span>
                  </div>
                  <span class="upload-success" *ngIf="!isUploadingLogo() && logoUrl()">Uploaded</span>
                </div>
                <ng-template #logoPlaceholder>
                  <span class="file-placeholder">Select logo image (PNG, JPG, WebP)</span>
                </ng-template>
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">
                <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                CAC Document
              </label>
              <div class="file-upload-wrapper">
                <input type="file" class="file-input" accept=".pdf,image/*" (change)="onCacDocumentSelected($event)" [disabled]="isUploadingCac()" #cacInput>
                <div class="file-upload-info" *ngIf="cacDocumentFile(); else cacPlaceholder">
                  <span class="file-name">{{ cacDocumentFile()?.name }}</span>
                  <div class="upload-progress" *ngIf="isUploadingCac()">
                    <div class="progress-bar" [style.width.%]="cacUploadProgress()"></div>
                    <span class="progress-text">Uploading... {{ cacUploadProgress() }}%</span>
                  </div>
                  <span class="upload-success" *ngIf="!isUploadingCac() && cacDocumentUrl()">Uploaded</span>
                </div>
                <ng-template #cacPlaceholder>
                  <span class="file-placeholder">Select CAC document (PDF, PNG, JPG)</span>
                </ng-template>
              </div>
            </div>

            <div class="error-message" *ngIf="errorMessage()">
              {{ errorMessage() }}
            </div>

            <button type="submit" class="btn-primary space-font" [disabled]="isLoading()">
              {{ isLoading() ? 'Creating Account...' : 'Continue to Setup' }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon" *ngIf="!isLoading()">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            <p class="login-link">Already registered? <a routerLink="/login">Log In</a></p>
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
          <span>Optimized Workflow</span>
        </div>
        <div class="feature-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="feature-icon">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Real-time Insights</span>
        </div>
        <div class="feature-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="feature-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Staff Management</span>
        </div>
      </footer>

      <!-- Bottom Branding -->
      <div class="bottom-brand">
        <span class="space-font bottom-brand-text">ServeIQ</span>
        <div class="bottom-links inter-font">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
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

    .form-input, .form-textarea, .form-select {
      display: block; width: 100%; box-sizing: border-box;
      padding: 13px 15px; border: 1.5px solid #e2e8f0; border-radius: 12px;
      font-size: 0.9375rem; font-family: 'Inter', sans-serif; color: #0f172a;
      background: white; transition: all 0.2s;
    }
    .form-input::placeholder, .form-textarea::placeholder { color: #94a3b8; }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none; border-color: #F97316;
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
    }
    .form-textarea { resize: none; }

    .select-wrapper { position: relative; }
    .form-select { appearance: none; padding-right: 36px; cursor: pointer; }
    .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; pointer-events: none; }

    .btn-primary {
      width: 100%; padding: 17px;
      background: #F97316; color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 4px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.2); transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3); }
    .btn-icon { width: 20px; height: 20px; }

    .login-link { margin: 0; text-align: center; font-size: 0.875rem; font-weight: 600; color: #64748b; }
    .login-link a { color: #d97706; text-decoration: none; font-weight: 700; }

    /* ===== NEMOTRON REASONING (Harness Nemotron) ===== */
    .nemotron-reasoning {
      background: rgba(249, 115, 22, 0.03); border: 1.5px dashed rgba(249, 115, 22, 0.2);
      border-radius: 12px; padding: 16px; margin: 8px 0;
      animation: fadeIn 0.3s ease-out;
    }
    .reasoning-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .ai-icon { width: 18px; height: 18px; }
    .reasoning-label { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; color: #F97316; text-transform: uppercase; }
    
    .thinking-loader {
      width: 6px; height: 6px; background: #F97316; border-radius: 50%;
      animation: pulse 1s infinite alternate;
    }

    .reasoning-bubble {
      background: rgba(132, 204, 22, 0.08); border-left: 3px solid #84CC16;
      padding: 10px 12px; border-radius: 4px 12px 12px 4px; margin-bottom: 10px;
    }
    .reasoning-content { font-size: 0.8125rem; color: #4D7C0F; font-style: italic; line-height: 1.5; }

    .suggestions-box { background: white; border: 1px solid #f1f5f9; padding: 10px 12px; border-radius: 8px; }
    .suggestions-content { font-size: 0.875rem; color: #334155; line-height: 1.5; }

    @keyframes pulse { from { opacity: 0.4; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* ===== FILE UPLOAD ===== */
    .file-upload-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-input {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 10;
    }
    .file-upload-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 15px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      min-height: 52px;
    }
    .file-name {
      flex: 1;
      font-size: 0.875rem;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-placeholder {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .upload-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 200px;
    }
    .progress-bar {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-bar::after {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #F97316, #fb923c);
      border-radius: 3px;
      animation: progressFill 0.3s ease-out;
    }
    .progress-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: #d97706;
      white-space: nowrap;
    }
    .upload-success {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #16a34a;
    }
    @keyframes progressFill {
      from { width: 0; }
      to { width: 100%; }
    }

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
    .bottom-links {
      display: flex; flex-wrap: wrap; align-items: center; gap: 16px;
    }
    .bottom-links a { font-size: 0.8125rem; color: #64748b; text-decoration: none; font-weight: 600; }
    .copyright { font-size: 0.75rem; color: #94a3b8; }

    /* ===== MOBILE RESPONSIVE ===== */
    @media (max-width: 520px) {
      .onboarding-card { padding: 28px 20px; border-radius: 16px; }
      .step-title { font-size: 1.05rem; }
      .onboarding-footer { gap: 16px 24px; }
      .bottom-brand { flex-direction: column; align-items: flex-start; padding: 16px 20px; }
      .bottom-links { gap: 10px; }
      .copyright { width: 100%; }
    }

    @media (max-width: 360px) {
      .onboarding-card { padding: 24px 16px; }
      .feature-item span { font-size: 0.7rem; }
    }
  `]
})
export class RegisterBusinessComponent {
  businessName = signal('');
  businessType = signal('');
  fullName = signal('');
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // File upload signals
  logoFile = signal<File | null>(null);
  cacDocumentFile = signal<File | null>(null);
  logoUrl = signal<string | null>(null);
  cacDocumentUrl = signal<string | null>(null);
  isUploadingLogo = signal(false);
  isUploadingCac = signal(false);
  logoUploadProgress = signal(0);
  cacUploadProgress = signal(0);

  // Reasoning signals
  isThinking = signal(false);
  reasoning = signal('');
  suggestions = signal('');

  private authService = inject(AuthService);
  private nemotron = inject(NemotronService);
  private router = inject(Router);

  private thinkingTimeout: any;

  onInfoChange() {
    if (!this.businessName() || !this.businessType()) return;

    if (this.thinkingTimeout) clearTimeout(this.thinkingTimeout);
    
    this.thinkingTimeout = setTimeout(() => {
      this.isThinking.set(true);
      this.reasoning.set('');
      this.suggestions.set('');

      const prompt = `I am starting a business called "${this.businessName()}" which is a "${this.businessType()}". 
      Can you provide a quick reasoning for why this setup is AI-ready and suggest one optimized workflow feature? 
      Keep the reasoning to one short sentence and the suggestion to one short bullet point.`;

      this.nemotron.askNemotron(
        prompt,
        (content, reasoning) => {
          if (reasoning) this.reasoning.set(reasoning);
          if (content) this.suggestions.update(prev => prev + content);
        },
        "You are ServeIQ's onboarding assistant. Be concise and professional."
      ).then(() => {
        this.isThinking.set(false);
      }).catch(() => {
        this.isThinking.set(false);
      });
    }, 1000);
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        Swal.fire({ icon: 'warning', title: 'Invalid File', text: 'Please select an image file for the logo.', confirmButtonColor: '#F97316' });
        return;
      }
      this.logoFile.set(file);
      this.uploadLogo();
    }
  }

  onCacDocumentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({ icon: 'warning', title: 'Invalid File', text: 'Please select a PDF or image file for the CAC document.', confirmButtonColor: '#F97316' });
        return;
      }
      this.cacDocumentFile.set(file);
      this.uploadCacDocument();
    }
  }

  private uploadLogo() {
    const file = this.logoFile();
    if (!file) return;

    this.isUploadingLogo.set(true);
    this.logoUploadProgress.set(0);

    this.authService.uploadFile(file).subscribe({
      next: (response) => {
        this.logoUrl.set(response.url);
        this.isUploadingLogo.set(false);
        this.logoUploadProgress.set(100);
      },
      error: (err) => {
        this.isUploadingLogo.set(false);
        this.logoUploadProgress.set(0);
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Failed to upload logo. Please try again.', confirmButtonColor: '#F97316' });
      }
    });
  }

  private uploadCacDocument() {
    const file = this.cacDocumentFile();
    if (!file) return;

    this.isUploadingCac.set(true);
    this.cacUploadProgress.set(0);

    this.authService.uploadFile(file).subscribe({
      next: (response) => {
        this.cacDocumentUrl.set(response.url);
        this.isUploadingCac.set(false);
        this.cacUploadProgress.set(100);
      },
      error: (err) => {
        this.isUploadingCac.set(false);
        this.cacUploadProgress.set(0);
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Failed to upload CAC document. Please try again.', confirmButtonColor: '#F97316' });
      }
    });
  }

  onSubmit() {
    if (!this.fullName() || !this.businessName() || !this.email() || !this.password() || !this.businessType()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: 'Please fill in all required fields to continue.',
        confirmButtonColor: '#F97316'
      });
      return;
    }

    if (!this.logoFile() || !this.cacDocumentFile()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Documents',
        text: 'Please upload both business logo and CAC document to continue.',
        confirmButtonColor: '#F97316'
      });
      return;
    }

    if (this.isUploadingLogo() || this.isUploadingCac()) {
      Swal.fire({
        icon: 'info',
        title: 'Upload in Progress',
        text: 'Please wait for file uploads to complete before submitting.',
        confirmButtonColor: '#F97316'
      });
      return;
    }

    this.isLoading.set(true);
    
    this.authService.register({
      fullName: this.fullName(),
      email: this.email(),
      password: this.password(),
      businessName: this.businessName(),
      businessType: this.businessType(),
      logoUrl: this.logoUrl() || undefined,
      cacDocumentUrl: this.cacDocumentUrl() || undefined
    }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Account Created!',
          text: 'Welcome to ServeIQ. Setting up your engine...',
          showConfirmButton: false,
          timer: 2000,
          background: '#ffffff',
          iconColor: '#F97316'
        });

        // Automatically login after registration
        this.authService.login(this.email(), this.password()).subscribe({
          next: () => {
            setTimeout(() => this.router.navigate(['/dashboard']), 1000);
          },
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.error?.message || 'Please try again with different credentials.',
          confirmButtonColor: '#F97316'
        });
      }
    });
  }
}
