import { __decorate } from "tslib";
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from "../../../../../libs/shared/data-access/src/index.ts";
import Swal from 'sweetalert2';
let LoginComponent = class LoginComponent {
    email = signal('');
    password = signal('');
    showPassword = signal(false);
    isLoading = signal(false);
    authService = inject(AuthService);
    router = inject(Router);
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
                }
                else {
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
};
LoginComponent = __decorate([
    Component({
        selector: 'app-login',
        standalone: true,
        imports: [CommonModule, RouterModule, FormsModule],
        templateUrl: './login.component.html',
        styleUrls: ['./login.component.scss']
    })
], LoginComponent);
export { LoginComponent };
//# sourceMappingURL=login.component.js.map