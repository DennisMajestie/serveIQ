import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

interface FeatureItem {
  title: string;
  body: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="POS & Operations"
      title="A POS that runs your entire floor"
      subtitle="From taking orders to settling bills to reconciling the end of day — ServeIQ gives your team one fast, reliable system."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'POS' }]"
    />
    <main class="pos">
      <section class="grid">
        @for (item of features; track item.title) {
          <article class="card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
        }
      </section>
      <section class="cta-band">
        <h2>Ready to upgrade your POS?</h2>
        <a class="btn" routerLink="/pricing">See Pricing</a>
      </section>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .pos {
        max-width: 1000px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .card {
        padding: 24px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
      }
      .card h3 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1rem;
        color: var(--primary);
      }
      .card p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.9375rem;
        line-height: 1.7;
      }
      .cta-band {
        margin-top: 64px;
        text-align: center;
        padding: 40px 24px;
        border-radius: 24px;
        background: color-mix(in srgb, var(--primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
      }
      .cta-band h2 {
        margin: 0 0 20px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.375rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 46px;
        padding: 0 28px;
        border-radius: 999px;
        background: var(--primary);
        color: var(--on-primary);
        text-decoration: none;
        font-weight: 600;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px color-mix(in srgb, var(--primary) 30%, transparent);
      }
      @media (min-width: 720px) {
        .grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `,
  ],
})
export class PosPageComponent extends SitePageComponent {
  readonly features: FeatureItem[] = [
    {
      title: 'Multi-Method Payment',
      body: 'Cash, POS card terminal, bank transfer, USSD, and Paystack. Settlement options designed for Nigerian and West African restaurants.',
    },
    {
      title: 'Kitchen Display Routing',
      body: 'Orders are automatically routed to the correct department — kitchen, bar, pastry — with real-time status tracking.',
    },
    {
      title: 'Discount Engine',
      body: 'Minimum-order thresholds, item-level and bill-level discounts. Staff get a real-time warning if a discount would push the bill below cost.',
    },
    {
      title: 'Stock & Ingredients',
      body: 'Track ingredient levels per item. Deduction happens automatically on order confirmation. Low-stock alerts in the dashboard.',
    },
    {
      title: 'Real-Time Dashboard',
      body: 'Live sales, open tabs, pending payments, active orders, and branch performance — all updating in real time.',
    },
    {
      title: 'Role-Based Access',
      body: 'Waiter, supervisor, manager, owner, super admin — each role sees exactly the screens and actions it needs.',
    },
  ];
}