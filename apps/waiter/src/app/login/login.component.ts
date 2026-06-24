import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // State
  pin = signal<string>('');
  pinError = signal<boolean>(false);
  isActivated = signal<boolean>(false);
  businessName = signal<string>('');
  
  // Activation Form
  adminEmail = '';
  adminPassword = '';
  isActivating = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const bizId = localStorage.getItem('businessId');
    const bizName = localStorage.getItem('businessName');
    
    if (bizId) {
      this.isActivated.set(true);
      this.businessName.set(bizName || 'ServeIQ Business');
    }
  }

  onActivateTerminal() {
    if (!this.adminEmail || !this.adminPassword) return;
    
    this.isActivating.set(true);
    this.authService.activateTerminal(this.adminEmail, this.adminPassword).subscribe({
      next: (res: any) => {
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
    if (!businessId) return;

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

  onDigit(digit: string) {
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
}
