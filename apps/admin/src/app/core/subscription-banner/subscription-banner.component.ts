import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="subService.subscription() as sub; else noSub">
      <div class="sb-banner" [class]="bannerClass(sub.status)">
        <span class="sb-icon">{{ statusIcon(sub.status) }}</span>
        <span class="sb-message">{{ statusMessage(sub) }}</span>
        <a *ngIf="sub.status === 'expired' || sub.status === 'past_due'"
           href="/app/billing" class="sb-link">Manage subscription</a>
      </div>
    </ng-container>
    <ng-template #noSub></ng-template>
  `,
  styles: [`
    .sb-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }
    .sb-banner.trialing { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .sb-banner.past_due { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .sb-banner.expired { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .sb-banner.canceled { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .sb-icon { font-size: 16px; flex-shrink: 0; }
    .sb-message { flex: 1; }
    .sb-link {
      font-weight: 600;
      color: inherit;
      text-decoration: underline;
      white-space: nowrap;
    }
  `],
})
export class SubscriptionBannerComponent implements OnInit {
  subService = inject(SubscriptionService);

  ngOnInit() {
    this.subService.load();
  }

  bannerClass(status: string | null): string {
    return status || '';
  }

  statusIcon(status: string | null): string {
    switch (status) {
      case 'trialing': return '⏳';
      case 'past_due': return '⚠️';
      case 'expired': return '🔒';
      case 'canceled': return '📋';
      default: return '';
    }
  }

  statusMessage(sub: any): string {
    switch (sub.status) {
      case 'trialing': {
        const ends = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
        if (!ends) return 'Your trial is active.';
        const days = Math.ceil((ends.getTime() - Date.now()) / 86400000);
        return `Trial ends in ${days} day${days !== 1 ? 's' : ''} — choose a plan to keep access.`;
      }
      case 'past_due': {
        const ends = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt) : null;
        if (!ends) return 'Payment failed — please update your payment method.';
        const days = Math.ceil((ends.getTime() - Date.now()) / 86400000);
        return `Payment failed — ${days} day${days !== 1 ? 's' : ''} before lockout.`;
      }
      case 'expired':
        return 'Your subscription has expired. Choose a plan to restore access.';
      case 'canceled':
        return 'Subscription canceled — access until ' + (sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'unknown') + '.';
      default:
        return '';
    }
  }
}