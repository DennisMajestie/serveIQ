import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../core/subscription.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="payment-success-page">
      <div class="success-card">
        <div class="checkmark-container">
          <div class="checkmark-circle">
            <svg class="checkmark" viewBox="0 0 52 52">
              <circle class="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14 27l7 7 16-16"/>
            </svg>
          </div>
        </div>
        <h1 class="title">Payment Successful!</h1>
        <p class="subtitle">Your subscription has been activated. You now have access to all the features of your chosen plan.</p>
        <div class="verify-error" *ngIf="verifyError()">
          <p>{{ verifyError() }}</p>
        </div>
        <div class="redirect-message">
          <p>Redirecting to dashboard in <strong>{{ countdown() }}</strong> seconds...</p>
        </div>
        <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
      </div>
  `,
  styles: [`
    .payment-success-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--background); padding: 24px; }
    .success-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 16px; padding: 48px; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
    .checkmark-container { margin-bottom: 24px; }
    .checkmark-circle { width: 80px; height: 80px; border-radius: 50%; background: #d1fae5; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .checkmark { width: 48px; height: 48px; }
    .checkmark-circle-bg { stroke: #059669; stroke-width: 2; }
    .checkmark-check { stroke: #059669; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; animation: draw-check 0.4s ease-out; }
    @keyframes draw-check { from { stroke-dashoffset: 48; } to { stroke-dashoffset: 0; } }
    .checkmark-circle-bg { stroke-dasharray: 157; stroke-dashoffset: 157; animation: draw-circle 0.4s ease-out forwards; }
    @keyframes draw-circle { to { stroke-dashoffset: 0; } }
    .title { font-size: 28px; font-weight: 700; color: var(--on-background); margin: 0 0 12px; }
    .subtitle { font-size: 16px; color: var(--secondary); margin: 0 0 32px; line-height: 1.5; }
    .redirect-message { font-size: 14px; color: var(--secondary); margin-bottom: 24px; }
    .verify-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; }
    .btn { padding: 12px 32px; border: none; border-radius: 8px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; font-size: 15px; transition: opacity 0.2s; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { opacity: 0.9; }
  `],
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);
  countdown = signal(10);
  verifyError = signal<string | null>(null);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    const reference =
      this.route.snapshot.queryParamMap.get('reference') ||
      this.route.snapshot.queryParamMap.get('trxref') ||
      sessionStorage.getItem('serveiq_subscription_ref');

    if (reference) {
      this.subscriptionService.verify(reference).subscribe({
        next: () => {
          sessionStorage.removeItem('serveiq_subscription_ref');
          this.subscriptionService.load();
        },
        error: (err) => {
          this.verifyError.set(err?.error?.message || 'Could not confirm your payment.');
        },
      });
    }

    this.timer = setInterval(() => {
      this.countdown.update(c => c - 1);
      if (this.countdown() <= 0) {
        this.goToDashboard();
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  goToDashboard() {
    if (this.timer) clearInterval(this.timer);
    this.router.navigate(['/app/dashboard']);
  }
}
