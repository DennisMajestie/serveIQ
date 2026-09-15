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
      eyebrow="Guest Experience"
      title="Guests scan, order, and track — right from their phone"
      subtitle="No app install. No waiting. A QR code at the table opens a fast, mobile-optimised menu where guests do everything themselves."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'QR Menu' }]"
    />
    <main class="qr">
      <section class="grid">
        @for (item of features; track item.title) {
          <article class="card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
        }
      </section>
      <section class="cta-band">
        <h2>Give your guests a modern dining experience</h2>
        <a class="btn" routerLink="/pricing">See Pricing</a>
      </section>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .qr {
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
export class QrMenuPageComponent extends SitePageComponent {
  readonly features: FeatureItem[] = [
    {
      title: 'Browse the Menu',
      body: 'Full menu with photos, descriptions, prices and dietary info — hosted at your branded public URL.',
    },
    {
      title: 'Place Orders',
      body: 'Guests add items directly from their phone. Orders appear instantly in the kitchen — no waiter relay needed.',
    },
    {
      title: 'Live Tracking',
      body: 'Guests watch their order move through Received → In Progress → Ready — updated in real time via WebSocket.',
    },
    {
      title: 'Call a Waiter',
      body: 'One tap to request service. The waiter gets a real-time notification linked to the table.',
    },
    {
      title: 'View & Pay Bill',
      body: 'Guests can view their bill breakdown and settle their share right from the same screen.',
    },
    {
      title: 'No Install Required',
      body: 'Progressive web app — works in any mobile browser. Add to home screen optional.',
    },
  ];
}