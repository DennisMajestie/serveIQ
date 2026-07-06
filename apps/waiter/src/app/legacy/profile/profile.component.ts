import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserApiService } from '@serveiq/shared/data-access';
import { User, UiThemeVariant } from '@serveiq/shared/models';
import { ThemePreferenceService } from '../../core/theme-preference.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-legacy-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class LegacyProfileComponent implements OnInit {
  private userService = inject(UserApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private themePref = inject(ThemePreferenceService);

  user = signal<User | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getInitials(): string {
    const name = this.user()?.fullName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  get uiThemeVariant(): UiThemeVariant {
    return this.user()?.uiThemeVariant || 'current';
  }

  toggleTheme() {
    const newVariant: UiThemeVariant = this.uiThemeVariant === 'legacy' ? 'current' : 'legacy';
    this.themePref.setPreference(newVariant);
    this.userService.updateMe({ uiThemeVariant: newVariant } as any).subscribe({
      next: (updated) => this.user.set(updated),
      error: () => {}
    });
    Swal.fire({
      icon: 'success',
      title: newVariant === 'legacy' ? 'Classic Theme' : 'Modern Theme',
      text: 'Theme updated. Reloading...',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.reload();
    });
  }

  changePin() {
    Swal.fire({
      title: 'Change PIN',
      html: `
        <div style="margin-bottom: 12px; color: #a0a0a0; font-size: 14px;">Enter new 4-digit PIN</div>
        <input id="pin-new" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 24px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box; letter-spacing: 8px;"
          placeholder="• • • •" />
        <div style="margin-top: 16px; color: #a0a0a0; font-size: 14px;">Confirm new PIN</div>
        <input id="pin-confirm" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 24px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box; letter-spacing: 8px; margin-top: 4px;"
          placeholder="• • • •" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Update PIN',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      didOpen: () => {
        const first = document.getElementById('pin-new') as HTMLInputElement;
        if (first) first.focus();
      },
      preConfirm: () => {
        const newPin = (document.getElementById('pin-new') as HTMLInputElement)?.value;
        const confirmPin = (document.getElementById('pin-confirm') as HTMLInputElement)?.value;
        if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
          Swal.showValidationMessage('PIN must be exactly 4 digits');
          return false;
        }
        if (newPin !== confirmPin) {
          Swal.showValidationMessage('PINs do not match');
          return false;
        }
        return newPin;
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.updatePin(result.value);
      }
    });
  }

  private updatePin(newPin: string) {
    const userId = this.user()?.id;
    if (!userId) return;

    this.userService.resetStaffPin(userId, newPin).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'PIN Updated',
          text: 'Your PIN has been changed successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Could not update PIN. Please try again.'
        });
      }
    });
  }

  logout() {
    Swal.fire({
      title: 'Logout?',
      text: 'You will be returned to the login screen.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}
