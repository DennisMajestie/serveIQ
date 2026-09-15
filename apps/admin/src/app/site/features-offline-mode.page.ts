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
      eyebrow="Offline Mode"
      title="Your restaurant never stops — neither does ServeIQ"
      subtitle="Orders and payments queue on the device and sync automatically when the Internet returns. No data lost, no double charges, no interrupted service."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Offline Mode' }]"
    />
    <main class="offline">
      <section class="list">
        @for (item of features; track item.title) {
          <article class="card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
        }
      </section>
      <section class="cta-band">
        <h2>Never lose an order to a bad connection</h2>
        <a class="btn" routerLink="/pricing">See Pricing</a>
      </section>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .offline {
        max-width: 860px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .card {
        padding: 28px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
      }
      .card h3 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.1rem;
        color: var(--primary);
      }
      .card p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.95rem;
        line-height: 1.75;
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
export class OfflineModePageComponent extends SitePageComponent {
  readonly features: FeatureItem[] = [
    {
      title: 'Local queue, automatic sync',
      body: 'Every order, bill, and payment is stored locally first. When connectivity returns, ServeIQ replays the queue in order and applies idempotency keys — so no operation is duplicated.',
    },
    {
      title: 'No double charges',
      body: 'Static idempotency keys per order and per split payment mean that even if a sync retries, the backend will not process the same payment twice.',
    },
    {
      title: 'Real-time when online, reliable when offline',
      body: 'When the network is up, guests and kitchen see updates in real time via WebSocket. When it drops, the app keeps working — and picks up exactly where it left off.',
    },
    {
      title: 'Built for emerging markets',
      body: 'ServeIQ was designed from day one for restaurants where connectivity is unpredictable. Power outages, network switches, rural areas — the workflow does not change.',
    },
  ];
}