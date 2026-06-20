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
        this.isLoading.set(false);
        console.log('[Login] Success, token in localStorage:', !!localStorage.getItem('token'));
        setTimeout(() => {
          console.log('[Login] Attempting navigation to /dashboard');
          this.router.navigate(['/dashboard']).then(success => {
            if (success) {
              console.log('[Login] Navigation successful');
            } else {
              console.error('[Login] Navigation failed');
            }
          });
        }, 1500);
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
