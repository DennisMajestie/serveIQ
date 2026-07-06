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
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: 'This email is already registered' });
        } else if (err.status === 400) {
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.error?.message || 'Invalid registration data' });
        } else {
          Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.error?.message || 'Registration failed. Check your connection and try again.' });
        }
      }
    });
  }
}
