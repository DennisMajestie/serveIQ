import { __decorate } from "tslib";
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from "../../../../../libs/shared/data-access/src/index.ts";
import Swal from 'sweetalert2';
let LoginComponent = class LoginComponent {
    // State
    pin = signal('');
    pinError = signal(false);
    isActivated = signal(false);
    businessName = signal('');
    // Activation Form
    adminEmail = '';
    adminPassword = '';
    isActivating = signal(false);
    authService = inject(AuthService);
    router = inject(Router);
    ngOnInit() {
        const bizId = localStorage.getItem('businessId');
        const bizName = localStorage.getItem('businessName');
        if (bizId) {
            this.isActivated.set(true);
            this.businessName.set(bizName || 'ServeIQ Business');
        }
    }
    onActivateTerminal() {
        if (!this.adminEmail || !this.adminPassword)
            return;
        this.isActivating.set(true);
        this.authService.activateTerminal(this.adminEmail, this.adminPassword).subscribe({
            next: (res) => {
                this.isActivated.set(true);
                this.businessName.set(res.data?.businessName || 'ServeIQ Business');
                this.isActivating.set(false);
                Swal.fire({ icon: 'success', title: 'Terminal Activated', timer: 1500, showConfirmButton: false });
            },
            error: () => {
                this.isActivating.set(false);
                Swal.fire({ icon: 'error', title: 'Activation Failed', text: 'Invalid admin credentials.' });
            }
        });
    }
    onPinSubmit() {
        const businessId = localStorage.getItem('businessId');
        if (!businessId)
            return;
        this.authService.verifyStaffPin(this.pin(), businessId).subscribe({
            next: () => {
                this.router.navigate(['/tables']);
            },
            error: (err) => {
                this.pinError.set(true);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Invalid PIN',
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#1e293b',
                    color: '#ef4444'
                });
                setTimeout(() => {
                    this.pin.set('');
                    this.pinError.set(false);
                }, 800);
            }
        });
    }
    onDigit(digit) {
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
};
LoginComponent = __decorate([
    Component({
        selector: 'app-login',
        standalone: true,
        imports: [CommonModule, FormsModule],
        templateUrl: './login.component.html',
        styleUrls: ['./login.component.scss']
    })
], LoginComponent);
export { LoginComponent };
//# sourceMappingURL=login.component.js.map