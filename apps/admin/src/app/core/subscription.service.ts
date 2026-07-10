import { Injectable, signal, inject } from '@angular/core';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@serveiq/shared/models';
import { SubscriptionsApiService } from '@serveiq/shared/data-access';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private subscriptionsApi = inject(SubscriptionsApiService);

  subscription = signal<Subscription | null>(null);
  loading = signal(true);
  plansLoading = signal(true);
  error = signal<string | null>(null);
  plans = signal<SubscriptionPlan[]>([]);

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

  loadPlans(): void {
    this.plansLoading.set(true);
    this.subscriptionsApi.getPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.plansLoading.set(false);
      },
      error: () => {
        this.plansLoading.set(false);
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
