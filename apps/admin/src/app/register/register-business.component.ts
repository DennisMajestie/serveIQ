import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UploadService } from '../services/upload.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register-business.component.html',
  styleUrls: ['./register-business.component.scss']
})
export class RegisterBusinessComponent {
  businessName = signal('');
  businessType = signal('');
  fullName = signal('');
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Step management
  currentStep = signal(1);
  totalSteps = 3;

  // File upload signals
  logoFile = signal<File | null>(null);
  cacDocumentFile = signal<File | null>(null);
  logoUrl = signal<string | null>(null);
  cacDocumentUrl = signal<string | null>(null);
  isUploadingLogo = signal(false);
  isUploadingCac = signal(false);
  logoUploadProgress = signal(0);
  cacUploadProgress = signal(0);

  private authService = inject(AuthService);
  private router = inject(Router);


  get stepPercent(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }

  get stepTitle(): string {
    switch (this.currentStep()) {
      case 1: return 'Step 1/3: Business Details';
      case 2: return 'Step 2/3: Admin Account';
      case 3: return 'Step 3/3: Documents';
      default: return 'Setup';
    }
  }

  nextStep() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 1:
        return !!this.businessName() && !!this.businessType() && !!this.fullName();
      case 2:
        return !!this.email() && !!this.password();
      case 3:
        return !!this.logoFile() && !!this.cacDocumentFile() && !this.isUploadingLogo() && !this.isUploadingCac();
      default:
        return false;
    }
  }

  onInfoChange() {
    // Logic removed as it was only for AI reasoning
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

    this.uploadService.uploadFile(file).subscribe({
      next: (response) => {
        console.log('[Upload] Logo success response:', response);
        const url = response.url;
        this.logoUrl.set(url);
        this.isUploadingLogo.set(false);
        this.logoUploadProgress.set(100);
        Swal.fire({
          icon: 'success',
          title: 'Logo Uploaded',
          text: 'Your business logo has been successfully uploaded.',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (err) => {
        console.error('[Upload] Logo failed:', err);
        this.isUploadingLogo.set(false);
        this.logoUploadProgress.set(0);
        const errorMsg = err.error?.message || 'Check your internet connection and try again.';
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: `Failed to upload logo: ${errorMsg}`, confirmButtonColor: '#F97316' });
      }
    });
  }

  private uploadCacDocument() {
    const file = this.cacDocumentFile();
    if (!file) return;

    this.isUploadingCac.set(true);
    this.cacUploadProgress.set(0);

    this.uploadService.uploadFile(file).subscribe({
      next: (response) => {
        console.log('[Upload] CAC success response:', response);
        const url = response.url;
        this.cacDocumentUrl.set(url);
        this.isUploadingCac.set(false);
        this.cacUploadProgress.set(100);
        Swal.fire({
          icon: 'success',
          title: 'CAC Document Uploaded',
          text: 'Your registration document has been successfully processed.',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (err) => {
        console.error('[Upload] CAC failed:', err);
        this.isUploadingCac.set(false);
        this.cacUploadProgress.set(0);
        const errorMsg = err.error?.message || 'Check your internet connection and try again.';
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: `Failed to upload CAC document: ${errorMsg}`, confirmButtonColor: '#F97316' });
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
      next: (res) => {
        console.log('[Register] Success:', res);
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
          error: (loginErr) => {
            console.error('[Register] Post-reg login failed:', loginErr);
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        console.error('[Register] Failed:', err);
        this.isLoading.set(false);
        
        if (err.status === 409) {
          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: 'This email is already registered',
            confirmButtonColor: '#F97316'
          });
        } else if (err.status === 400) {
          const errorMsg = err.error?.message || 'Invalid registration data';
          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: errorMsg,
            confirmButtonColor: '#F97316'
          });
        } else {
          const errorMsg = err.error?.message || 'Registration failed. Check your internet connection or try different credentials.';
          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: errorMsg,
            confirmButtonColor: '#F97316'
          });
        }
      }
    });
  }
}
