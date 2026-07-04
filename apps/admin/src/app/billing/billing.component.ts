import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../core/subscription.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="billing-page">
      <div class="page-header">
        <h2 class="page-title">Billing & Subscription</h2>
      </div>

      <div *ngIf="subService.loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading subscription...</p>
      </div>

      <ng-container *ngIf="!subService.loading()">
        <div *ngIf="subService.subscription() as sub" class="current-subscription">
          <div class="sub-header">
            <h3>Current Subscription</h3>
            <span class="status-badge" [class]="'status-' + sub.status">
              {{ sub.status | titlecase }}
            </span>
          </div>

          <div class="sub-details">
            <div class="detail-row" *ngIf="sub.plan">
              <span class="label">Plan</span>
              <span class="value">{{ sub.plan.name }}</span>
            </div>
            <div class="detail-row" *ngIf="sub.currentPeriodEnd">
              <span class="label">Renewal Date</span>
              <span class="value">{{ sub.currentPeriodEnd | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row" *ngIf="sub.trialEndsAt">
              <span class="label">Trial Ends</span>
              <span class="value">{{ sub.trialEndsAt | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row" *ngIf="sub.gracePeriodEndsAt">
              <span class="label">Grace Period Ends</span>
              <span class="value urgent">{{ sub.gracePeriodEndsAt | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row" *ngIf="sub.canceledAt">
              <span class="label">Canceled</span>
              <span class="value">{{ sub.canceledAt | date:'mediumDate' }}</span>
            </div>
          </div>

          <div class="sub-actions" *ngIf="sub.status === 'active' || sub.status === 'trialing'">
            <button class="btn btn-secondary" (click)="cancelSubscription()">Cancel Subscription</button>
          </div>
        </div>

        <div class="plans-section" *ngIf="subService.status !== 'active' || !subService.subscription()?.plan">
          <h3>{{ subService.subscription() ? 'Upgrade Your Plan' : 'Choose a Plan' }}</h3>
          <p class="plans-subtitle" *ngIf="!subService.subscription()">Select a plan to start using ServeIQ</p>

          <div class="plans-grid">
            <div class="plan-card" *ngFor="let plan of subService.plans()" [class.featured]="plan.name === 'Pro'" [class.current-plan]="subService.subscription()?.plan?.name === plan.name">
              <div class="plan-name">{{ plan.name }}</div>
              <div class="plan-price">
                <span class="amount">{{ plan.price === 0 ? 'Free' : '₦' + (plan.price / 100 | number:'1.2-2') }}</span>
                <span class="interval" *ngIf="plan.price > 0">/month</span>
              </div>
              <ul class="plan-features">
                <li>Up to {{ plan.features.maxTables }} tables</li>
                <li>Up to {{ plan.features.maxWaiters }} waiters</li>
                <li>{{ plan.features.reportingEnabled ? 'Reporting & analytics' : 'Basic reporting' }}</li>
              </ul>
              <button
                class="btn"
                [class.btn-primary]="plan.price > 0"
                [class.btn-success]="plan.price === 0"
                [disabled]="isProcessing() || subService.subscription()?.plan?.name === plan.name"
                (click)="selectPlan(plan)">
                {{ subService.subscription()?.plan?.name === plan.name ? 'Current Plan' : plan.price === 0 ? 'Start Free' : 'Choose ' + plan.name }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .billing-page { padding: 24px; max-width: 960px; margin: 0 auto; }
    .page-header { margin-bottom: 32px; }
    .page-title { font-size: 24px; font-weight: 700; margin: 0; color: var(--on-background); }

    .loading-state { text-align: center; padding: 64px 0; color: var(--secondary); }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--outline-variant); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .current-subscription { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 24px; margin-bottom: 32px; }
    .sub-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .sub-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: capitalize; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-trialing { background: #dbeafe; color: #1e40af; }
    .status-past_due { background: #fef3c7; color: #92400e; }
    .status-canceled { background: #f3f4f6; color: #374151; }
    .status-expired { background: #fee2e2; color: #991b1b; }
    .sub-details { display: flex; flex-direction: column; gap: 12px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; }
    .detail-row .label { color: var(--secondary); font-size: 14px; }
    .detail-row .value { font-weight: 600; font-size: 14px; }
    .detail-row .value.urgent { color: var(--error); }
    .sub-actions { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--outline-variant); }

    .plans-section { margin-top: 16px; }
    .plans-section h3 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    .plans-subtitle { color: var(--secondary); margin: 0 0 24px; font-size: 14px; }

    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .plan-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: box-shadow 0.2s; }
    .plan-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .plan-card.featured { border-color: var(--primary); border-width: 2px; }
    .plan-card.current-plan { opacity: 0.7; }
    .plan-name { font-size: 20px; font-weight: 700; }
    .plan-price { display: flex; align-items: baseline; gap: 4px; }
    .plan-price .amount { font-size: 28px; font-weight: 800; color: var(--on-background); }
    .plan-price .interval { font-size: 14px; color: var(--secondary); }
    .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .plan-features li { font-size: 14px; color: var(--on-surface); padding-left: 20px; position: relative; }
    .plan-features li::before { content: '✓'; position: absolute; left: 0; color: var(--primary); font-weight: 700; }

    .btn { padding: 10px 24px; border: none; border-radius: 8px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; font-size: 14px; transition: opacity 0.2s; text-align: center; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-secondary { background: var(--secondary-container); color: var(--on-secondary-container); }
    .btn-success { background: #059669; color: white; }
    .btn-secondary:hover { opacity: 0.9; }
  `],
})
export class BillingComponent implements OnInit {
  subService = inject(SubscriptionService);
  isProcessing = signal(false);

  ngOnInit() {
    this.subService.load();
  }

  selectPlan(plan: any): void {
    if (this.isProcessing()) return;

    if (plan.price === 0) {
      this.chooseFreePlan(plan);
    } else {
      this.choosePaidPlan(plan);
    }
  }

  private chooseFreePlan(plan: any): void {
    if (!plan.id) {
      Swal.fire({ icon: 'error', title: 'Free plan not available', text: 'Please contact support.' });
      return;
    }
    this.isProcessing.set(true);
    this.subService.initializePlan(plan.id).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        Swal.fire({ icon: 'success', title: 'Subscription activated!', timer: 2000, showConfirmButton: false });
        this.subService.load();
      },
      error: () => {
        this.isProcessing.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to activate plan' });
      },
    });
  }

  private choosePaidPlan(plan: any): void {
    if (!plan.id) {
      Swal.fire({ icon: 'error', title: 'Plan not found', text: 'Please refresh and try again.' });
      return;
    }
    this.isProcessing.set(true);
    this.subService.initializePlan(plan.id).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        }
      },
      error: () => {
        this.isProcessing.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to initiate payment' });
      },
    });
  }

  cancelSubscription(): void {
    Swal.fire({
      title: 'Cancel Subscription?',
      text: 'You will continue to have access until the end of the current billing period.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Keep it',
    }).then(result => {
      if (result.isConfirmed) {
        this.subService.cancel().subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Subscription canceled' });
            this.subService.load();
          },
            error: () => Swal.fire({ icon: 'error', title: 'Failed to cancel' }),
        });
      }
    });
  }
}
