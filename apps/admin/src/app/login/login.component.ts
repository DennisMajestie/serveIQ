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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  isLoading = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  forgotPassword() {
    Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'name@business.com',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      confirmButtonText: 'Send Reset Link',
      cancelButtonText: 'Cancel',
      background: '#1e293b',
      color: '#fff',
      inputAttributes: { autocapitalize: 'off' },
      preConfirm: (email) => {
        if (!email) {
          Swal.showValidationMessage('Please enter your email');
          return;
        }
        return new Promise((resolve, reject) => {
          this.authService.forgotPassword({ email }).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
        });
      }
    }).then((result) => {
      if (result.isConfirmed && result.value?.token) {
        this.router.navigate(['/reset-password'], { queryParams: { token: result.value.token } });
      }
    });
  }

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
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Failed',
            text: 'Invalid email or password',
            confirmButtonColor: '#F97316'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Failed',
            text: err.error?.message || 'Please check your credentials and try again.',
            confirmButtonColor: '#F97316'
          });
        }
      }
    });
  }
}
