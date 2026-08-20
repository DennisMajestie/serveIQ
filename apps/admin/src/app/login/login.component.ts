import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@serveiq/shared/data-access';
import { PermissionService } from '../core/permission.service';
import { ThemeService } from '../core/theme.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  isLoading = signal(false);
  isBooting = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private permissionService = inject(PermissionService);
  themeService = inject(ThemeService);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const userRole = this.route.snapshot.queryParamMap.get('role') || localStorage.getItem('userRole');
    if (token) {
      this.isBooting.set(true);
      this.authService.setToken(token);
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }
      const target = userRole === 'super_admin' ? '/app/admin/dashboard' : '/app/dashboard';
      this.permissionService.loadPermissions().subscribe({
        next: () => this.router.navigate([target], { replaceUrl: true }),
        error: () => this.router.navigate([target], { replaceUrl: true })
      });
    }
  }

  forgotPassword() {
    Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'name@business.com',
      showCancelButton: true,
      confirmButtonText: 'Send Reset Link',
      cancelButtonText: 'Cancel',
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
          text: 'Please enter both email and password to access your dashboard.'
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

        this.permissionService.loadPermissions().subscribe({
          next: () => {
            this.isLoading.set(false);
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'super_admin') {
              this.router.navigate(['/app/admin/dashboard']);
            } else {
              this.router.navigate(['/app/dashboard']);
            }
          },
          error: () => {
            this.isLoading.set(false);
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'super_admin') {
              this.router.navigate(['/app/admin/dashboard']);
            } else {
              this.router.navigate(['/app/dashboard']);
            }
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Failed',
            text: 'Invalid email or password'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Failed',
            text: err.error?.message || 'Please check your credentials and try again.'
          });
        }
      }
    });
  }
}
