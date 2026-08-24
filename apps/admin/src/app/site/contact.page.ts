import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      title="Talk to a human"
      subtitle="Demo requests, onboarding help, or just questions — the fastest way to reach us is WhatsApp. We reply within business hours (Mon–Sat, 8am–6pm WAT)."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Contact' }]"
    />
    <main class="contact">
      <div class="cards">
        <a class="card primary" href="https://wa.me/2348000000000?text=Hello%20ServeIQ%2C%20I%27d%20like%20to%20know%20more" target="_blank" rel="noopener">
          <span class="material-symbols-outlined">chat</span>
          <h2>WhatsApp</h2>
          <p>+234 800 000 0000</p>
          <span class="cta">Start chat</span>
        </a>

        <a class="card" href="mailto:hello@serveiq.io">
          <span class="material-symbols-outlined">mail</span>
          <h2>Email</h2>
          <p>hello@serveiq.io</p>
          <span class="cta">Send email</span>
        </a>

        <a class="card" routerLink="/register">
          <span class="material-symbols-outlined">rocket_launch</span>
          <h2>Book a demo</h2>
          <p>See ServeIQ running your floor, live.</p>
          <span class="cta">Register interest</span>
        </a>
      </div>

      <section class="where">
        <h2>Serving restaurants across Nigeria</h2>
        <p>Lagos · Abuja · Port Harcourt — and everywhere with a kitchen worth protecting.</p>
      </section>
    </main>
    <app-site-footer />
  `,
  styles: [
    `
      .contact {
        max-width: 960px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--primary) 45%, transparent);
        box-shadow: 0 16px 32px color-mix(in srgb, var(--primary) 14%, transparent);
      }
      .card.primary {
        background: color-mix(in srgb, var(--primary) 12%, transparent);
        border-color: color-mix(in srgb, var(--primary) 40%, transparent);
      }
      .card .material-symbols-outlined {
        font-size: 28px;
        color: var(--primary);
        margin-bottom: 6px;
      }
      .card h2 {
        margin: 0;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.125rem;
      }
      .card p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.9375rem;
      }
      .cta {
        margin-top: 12px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary);
      }
      .where {
        margin-top: 48px;
        text-align: center;
      }
      .where h2 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.125rem;
      }
      .where p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.9375rem;
      }
      @media (min-width: 720px) {
        .cards {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `,
  ],
})
export class ContactPageComponent extends SitePageComponent {}
