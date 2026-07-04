import { Injectable, signal, inject } from '@angular/core';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@serveiq/shared/models';
import { SubscriptionsApiService } from '@serveiq/shared/data-access';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private subscriptionsApi = inject(SubscriptionsApiService);

  subscription = signal<Subscription | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  plans = signal<SubscriptionPlan[]>([
    {
      id: '',
      name: 'Basic',
      price: 0,
      currency: 'NGN',
      billingInterval: 'monthly',
      features: { maxTables: 5, maxWaiters: 3, reportingEnabled: false },
      isActive: true,
    },
    {
      id: '',
      name: 'Pro',
      price: 2500000,
      currency: 'NGN',
      billingInterval: 'monthly',
      features: { maxTables: 20, maxWaiters: 15, reportingEnabled: true },
      isActive: true,
    },
    {
      id: '',
      name: 'Enterprise',
      price: 7500000,
      currency: 'NGN',
      billingInterval: 'monthly',
      features: { maxTables: 100, maxWaiters: 50, reportingEnabled: true },
      isActive: true,
    },
  ]);

  get status(): SubscriptionStatus | null {
    return this.subscription()?.status ?? null;
  }

  get isActiveOrTrialing(): boolean {
    const s = this.status;
    return s === 'active' || s === 'trialing';
  }

  get isExpired(): boolean {
    return this.status === 'expired';
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.subscriptionsApi.getCurrent().subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.subscription.set(null);
        } else {
          this.error.set('Failed to load subscription');
        }
        this.loading.set(false);
      },
    });
  }

  initializePlan(planId: string) {
    return this.subscriptionsApi.initialize(planId);
  }

  cancel() {
    return this.subscriptionsApi.cancel();
  }
}
