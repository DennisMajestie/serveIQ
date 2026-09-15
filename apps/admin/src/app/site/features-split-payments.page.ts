import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

interface SplitMode {
  name: string;
  description: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="Split Payments"
      title="Split the bill, not the night"
      subtitle="ServeIQ lets each guest pay for exactly what they ate — with four flexible allocation modes and independent per-guest settlement."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Split Payments' }]"
    />
    <main class="split">
      <section class="modes">
        <div class="section-head">
          <h2 class="title">Four ways to split</h2>
        </div>
        <div class="mode-list">
          @for (mode of modes; track mode.name; let i = $index) {
            <article class="mode">
              <span class="mode-num">{{ i + 1 }}</span>
              <div>
                <h3>{{ mode.name }}</h3>
                <p>{{ mode.description }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="how">
        <div class="section-head">
          <h2 class="title">How it works at the table</h2>
        </div>
        <ol class="how-list">
          <li><strong>Open the bill</strong> — the waiter sees the full tab with all orders and running totals.</li>
          <li><strong>Tap a guest card</strong> — choose items, enter an amount, or pick a percentage.</li>
          <li><strong>Charge that guest</strong> — pay by cash, card, transfer, USSD, or Paystack. Each guest is settled independently.</li>
          <li><strong>Tab stays open</strong> — the bill remains active until every share is paid. Split-lock prevents re-ordering after payment.</li>
          <li><strong>Last guest pays</strong> — the tab closes automatically and the bill status updates to "Paid".</li>
        </ol>
      </section>

      <section class="cta-band">
        <h2>Ready to offer real split payments?</h2>
        <a class="btn" routerLink="/pricing">See Pricing</a>
      </section>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .split {
        max-width: 900px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .section-head {
        text-align: center;
        margin-bottom: 32px;
      }
      .title {
        margin: 0;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.6rem;
      }
      .mode-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .mode {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
      }
      .mode-num {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: var(--primary);
        color: var(--on-primary);
        font-weight: 700;
        font-size: 0.9375rem;
      }
      .mode h3 {
        margin: 0 0 4px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.05rem;
      }
      .mode p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.9375rem;
        line-height: 1.7;
      }
      .how {
        margin-top: 64px;
        padding: 40px 24px;
        border-radius: 24px;
        background: color-mix(in srgb, var(--surface-container) 60%, transparent);
      }
      .how-list {
        margin: 0 auto;
        max-width: 640px;
        padding-left: 22px;
        color: var(--secondary);
        font-size: 1rem;
        line-height: 2;
      }
      .how-list strong {
        color: var(--on-background);
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
    `,
  ],
})
export class SplitPaymentsPageComponent extends SitePageComponent {
  readonly modes: SplitMode[] = [
    {
      name: 'By Item',
      description:
        'Tap the items each guest ate. ServeIQ calculates their share instantly, including proportional service charge and VAT.',
    },
    {
      name: 'By Amount',
      description:
        'Enter a fixed amount a guest wants to pay. ServeIQ allocates it against items and shows the remaining balance.',
    },
    {
      name: 'By Percentage',
      description:
        'Split the bill as a percentage of the total. Ideal for even-ish splits where one guest covered a few extras.',
    },
    {
      name: 'Remaining Balance',
      description:
        'The last guest picks up whatever is left — service charge, rounding, and all. The tab closes automatically.',
    },
  ];
}