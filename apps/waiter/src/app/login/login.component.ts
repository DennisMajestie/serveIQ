import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  pin = signal<string>('');
  pinError = signal<boolean>(false);

  private router = inject(Router);

  onDigit(digit: string) {
    if (this.pin().length < 6) {
      this.pin.set(this.pin() + digit);
      this.pinError.set(false);

      if (this.pin().length === 6) {
        // Demo: Let's say correct PIN is 123456
        if (this.pin() === '123456') {
          this.router.navigate(['/tables']);
        } else {
          this.pinError.set(true);
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Incorrect PIN',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            background: '#1e293b',
            color: '#ef4444'
          });

          setTimeout(() => {
            this.pin.set('');
            this.pinError.set(false);
          }, 800);
        }
      }
    }
  }

  clearPin() {
    this.pin.set('');
  }
}
