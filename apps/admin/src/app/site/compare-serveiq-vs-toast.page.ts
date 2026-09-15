import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

interface ComparisonRow {
  feature: string;
  serveiq: boolean | string;
  toast: boolean | string;
}

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="Comparison"
      title="ServeIQ vs Toast POS"
      subtitle="Toast is a well-known US-based restaurant POS. Here is how ServeIQ compares — especially for restaurants in Nigeria and West Africa."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Compare', url: '/' }, { label: 'ServeIQ vs Toast' }]"
    />
    <main class="compare">
      <section class="table-wrap">
        <div class="table">
          <div class="row head">
            <div class="cell feature">Feature</div>
            <div class="cell serveiq">ServeIQ</div>
            <div class="cell toast">Toast</div>
          </div>
          @for (row of rows; track row.feature; let i = $index) {
            <div class="row" [class.alt]="i % 2 === 1">
              <div class="cell feature">{{ row.feature }}</div>
              <div class="cell serveiq">
                @if (row.serveiq === true) {
                  <span class="yes">&#10003;</span>
                } @else if (row.serveiq === false) {
                  <span class="no">&#10007;</span>
                } @else {
                  <span>{{ row.serveiq }}</span>
                }
              </div>
              <div class="cell toast">
                @if (row.toast === true) {
                  <span class="no">&#10007;</span>
                } @else if (row.toast === false) {
                  <span class="yes">&#10003;</span>
                } @else {
                  <span>{{ row.toast }}</span>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <section class="bottom-line">
        <h2>The bottom line</h2>
        <p>
          Toast is built primarily for the US market. <strong>ServeIQ is purpose-built for restaurants in Nigeria and West Africa</strong> —
          with native Naira support, bank transfer and USSD payment settlement, offline-first reliability, and per-guest split payments
          that work at the table without extra hardware. If you need transparent pricing without per-terminal fees or long-term contracts,
          ServeIQ is the stronger fit.
        </p>
      </section>

      <section class="cta-band">
        <h2>Try ServeIQ free</h2>
        <a class="btn" routerLink="/pricing">See Pricing</a>
      </section>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .compare {
        max-width: 900px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .table-wrap {
        border: 1px solid color-mix(in srgb, var(--on-background) 12%, transparent);
        border-radius: 20px;
        overflow: hidden;
      }
      .table {
        display: flex;
        flex-direction: column;
      }
      .row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        border-top: 1px solid color-mix(in srgb, var(--on-background) 8%, transparent);
      }
      .row.head {
        border-top: none;
        background: var(--primary);
        color: var(--on-primary);
        font-weight: 600;
        font-size: 0.875rem;
      }
      .row.alt {
        background: color-mix(in srgb, var(--surface-container) 45%, transparent);
      }
      .cell {
        padding: 14px 18px;
        font-size: 0.9rem;
      }
      .cell.feature {
        font-weight: 500;
      }
      .cell.serveiq,
      .cell.toast {
        text-align: center;
        font-weight: 500;
      }
      .cell.serveiq {
        color: var(--primary);
      }
      .yes {
        color: #16a34a;
        font-weight: 700;
      }
      .no {
        color: #dc2626;
        font-weight: 700;
      }
      .bottom-line {
        margin-top: 48px;
        padding: 32px;
        border-radius: 20px;
        background: color-mix(in srgb, var(--surface-container) 60%, transparent);
      }
      .bottom-line h2 {
        margin: 0 0 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.3rem;
      }
      .bottom-line p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.95rem;
        line-height: 1.8;
      }
      .bottom-line strong {
        color: var(--on-background);
      }
      .cta-band {
        margin-top: 48px;
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
export class ServeiqVsToastPageComponent extends SitePageComponent {
  readonly rows: ComparisonRow[] = [
    { feature: 'Per-guest split payment by item', serveiq: true, toast: false },
    { feature: 'Offline-first ordering & payment', serveiq: true, toast: false },
    { feature: 'QR code table ordering (no app)', serveiq: true, toast: 'Mobile app only' },
    { feature: 'Guest live order tracking', serveiq: true, toast: false },
    { feature: 'Naira (NGN) + transfer/USSD support', serveiq: true, toast: false },
    { feature: 'Multi-branch from day one', serveiq: true, toast: 'Enterprise only' },
    { feature: 'Kitchen department routing', serveiq: true, toast: 'Add-ons' },
    { feature: 'Ingredient stock tracking', serveiq: true, toast: 'Add-on' },
    { feature: 'Transparent pricing', serveiq: true, toast: false },
    { feature: 'Per-terminal fees', serveiq: false, toast: true },
    { feature: 'Long-term contracts', serveiq: false, toast: 'Often required' },
  ];
}