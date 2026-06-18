import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
          console.log('Login successful!');
          this.router.navigate(['/tables']);
        } else {
          this.pinError.set(true);
          setTimeout(() => {
            this.pin.set('');
            this.pinError.set(false);
          }, 1000);
        }
      }
    }
  }

  clearPin() {
    this.pin.set('');
  }
}
