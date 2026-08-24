import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

interface Plan {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="Beta pricing"
      title="Simple plans that grow with your floor"
      subtitle="Early partners lock in beta pricing for their first year — no setup fees, no per-order cut. Your money stays yours."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Pricing' }]"
    />
    <main class="pricing">
      <div class="plans">
        @for (plan of plans; track plan.name) {
          <article class="plan" [class.highlighted]="plan.highlighted">
            @if (plan.highlighted) {
              <span class="badge">Most popular</span>
            }
            <h2>{{ plan.name }}</h2>
            <p class="price">{{ plan.price }}<span>/ {{ plan.period }}</span></p>
            <p class="blurb">{{ plan.blurb }}</p>
            <ul>
              @for (feature of plan.features; track feature) {
                <li>
                  <span class="material-symbols-outlined">check_circle</span>{{ feature }}
                </li>
              }
            </ul>
            <a
              class="btn"
              [class.btn-primary]="plan.highlighted"
              [class.btn-outline]="!plan.highlighted"
              routerLink="/register"
            >{{ plan.cta }}</a>
          </article>
        }
      </div>

      <p class="note">
        Prices in Naira, VAT exclusive. Need something custom — multiple branches or
        franchise terms? <a href="https://wa.me/2348000000000" target="_blank" rel="noopener">Message us on WhatsApp</a>.
      </p>
    </main>
    <app-site-footer />
  `,
  styles: [
    `
      .pricing {
        max-width: 1040px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .plans {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .plan {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 28px 24px;
        border-radius: 24px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
      }
      .plan.highlighted {
        border-color: color-mix(in srgb, var(--primary) 55%, transparent);
        background: color-mix(in srgb, var(--primary) 8%, transparent);
        box-shadow: 0 24px 48px color-mix(in srgb, var(--primary) 16%, transparent);
      }
      .badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: var(--on-primary);
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 4px 12px;
        border-radius: 999px;
      }
      .plan h2 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.125rem;
      }
      .price {
        margin: 0 0 8px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 2rem;
        font-weight: 700;
      }
      .price span {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--secondary);
      }
      .blurb {
        margin: 0 0 18px;
        color: var(--secondary);
        font-size: 0.9375rem;
        line-height: 1.6;
      }
      ul {
        list-style: none;
        margin: 0 0 24px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
      }
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9375rem;
        color: var(--on-background);
      }
      li .material-symbols-outlined {
        font-size: 18px;
        color: var(--primary);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9375rem;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .btn:hover {
        transform: translateY(-1px);
      }
      .btn-primary {
        background: var(--primary);
        color: var(--on-primary);
        box-shadow: 0 12px 24px color-mix(in srgb, var(--primary) 30%, transparent);
      }
      .btn-outline {
        border: 1.5px solid color-mix(in srgb, var(--on-background) 22%, transparent);
        color: var(--on-background);
      }
      .note {
        margin: 36px auto 0;
        max-width: 560px;
        text-align: center;
        color: var(--secondary);
        font-size: 0.875rem;
        line-height: 1.6;
      }
      .note a {
        color: var(--primary);
      }
      @media (min-width: 900px) {
        .plans {
          grid-template-columns: repeat(3, 1fr);
          align-items: stretch;
        }
      }
    `,
  ],
})
export class PricingPageComponent extends SitePageComponent {
  /** Edit these to match the plans configured in your billing module (Paystack plan codes). */
  readonly plans: Plan[] = [
    {
      name: 'Starter',
      price: '₦15,000',
      period: 'month',
      blurb: 'Everything a single location needs to stop leaking revenue.',
      features: [
        'Point of sale & kitchen display',
        'Live floor plan and QR menu',
        'Up to 5 staff PINs',
        'Paystack / transfer payments',
        'Daily sales summary',
      ],
      cta: 'Start free trial',
    },
    {
      name: 'Growth',
      price: '₦35,000',
      period: 'month',
      blurb: 'Inventory, tabs and shift control for busy kitchens.',
      highlighted: true,
      features: [
        'Everything in Starter',
        'Recipe-level inventory & suppliers',
        'Open tabs — trusted customer credit',
        'Shifts with cash handoff',
        'Full analytics & staff performance',
        'Up to 20 staff PINs',
      ],
      cta: 'Start free trial',
    },
    {
      name: 'Multi-branch',
      price: 'Custom',
      period: '',
      blurb: 'One view across every branch, with enterprise controls.',
      features: [
        'Everything in Growth',
        'Cross-branch dashboard & reports',
        'Device management & audit logs',
        'Unlimited staff PINs',
        'Dedicated onboarding & support',
      ],
      cta: 'Talk to us',
    },
  ];
}
