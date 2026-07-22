import { Component, signal, inject, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register-business.component.html',
  styleUrls: ['./register-business.component.scss']
})
export class RegisterBusinessComponent {
  @HostBinding('attr.data-theme') theme = 'dark';
  businessName = signal('');
  pin = signal('');
  fullName = signal('');
  email = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPin = signal(false);

  currentStep = signal(1);
  totalSteps = 2;

  private authService = inject(AuthService);
  private router = inject(Router);

  get stepPercent(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }

  get stepTitle(): string {
    return this.currentStep() === 1 ? 'Business Profile' : 'Administrator';
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
      case 1: return !!this.businessName() && !!this.pin();
      case 2: return !!this.fullName() && !!this.email();
      default: return false;
    }
  }

  playDemo() {
    Swal.fire({
      title: 'ServeIQ — At a Glance',
      html: `
        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:12px">
          <iframe style="position:absolute;top:0;left:0;width:100%;height:100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
        </div>
        <p style="font-size:14px;color:#a0a0a0;line-height:1.6;margin:0">AI-powered order management, real-time tracking, POS integration, and intelligent analytics — all in one platform.</p>
      `,
      confirmButtonText: 'Close',
      width: 640,
      background: '#1e293b',
      color: '#fff',
    });
  }

  onSubmit() {
    if (!this.businessName() || !this.fullName() || !this.email() || !this.pin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: 'Please fill in all required fields to continue.'
      });
      return;
    }

    this.isLoading.set(true);

    this.authService.register({
      fullName: this.fullName(),
      email: this.email(),
      password: this.pin(),
      businessName: this.businessName(),
      businessType: 'restaurant'
    }).subscribe({
      next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Platform Initialized!',
            text: 'Welcome to ServeIQ. Your Luminous Engine is active.',
            showConfirmButton: false,
            timer: 2000
          });

        this.authService.login(this.email(), this.pin()).subscribe({
          next: () => {
            setTimeout(() => this.router.navigate(['/app/setup']), 1000);
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err: any) => {
        this.isLoading.set(false);

        if (err.status === 409) {
          const msg = err.error?.message || err.error?.error || err.message || 'This email is already registered';
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: msg });
        } else if (err.status === 400) {
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.error?.message || 'Invalid registration data' });
        } else {
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.error?.message || 'Registration failed. Check your connection and try again.' });
        }
      }
    });
  }
}
