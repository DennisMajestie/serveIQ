import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    <main class="about">
      <header class="head">
        <span class="eyebrow">About ServeIQ</span>
        <h1>Restaurants lose money in the gaps between their tools. We close them.</h1>
      </header>

      <section class="story">
        <p>
          Most Nigerian restaurants run on a patchwork: a till here, a notebook there, a
          kitchen shouting across the room, and stock counted once a week by hope. Every
          gap is an opportunity — for orders to vanish, for cash to walk out the door,
          for a busy shift to become an unreconciled one.
        </p>
        <p>
          ServeIQ started with a simple conviction: a restaurant deserves one system
          where the till, the kitchen screen, the floor plan, the stockroom and the books
          are the same system — not five tools duct-taped together. So we built it: every
          order accounted for from the table to the bank, every shift reconciled, every
          plate traced back to stock.
        </p>
        <p>
          We're a Nigerian company building for Nigerian realities — patchy internet
          (so the waiter app keeps working offline), trusted-customer tabs (so your
          regulars don't have to carry cash), and payments through the providers your
          customers already use.
        </p>
      </section>

      <section class="values">
        <article>
          <span class="material-symbols-outlined">verified</span>
          <h2>Every order accounted for</h2>
          <p>If it was rung, printed, or served — it's in the books. Reconciliation isn't a monthly audit; it happens at every shift close.</p>
        </article>
        <article>
          <span class="material-symbols-outlined">offline_bolt</span>
          <h2>Built for real connectivity</h2>
          <p>The floor keeps moving when the internet doesn't. Orders taken offline sync the moment you're back.</p>
        </article>
        <article>
          <span class="material-symbols-outlined">storefront</span>
          <h2>Operators first</h2>
          <p>We build with restaurant owners and floor staff, not just for them. If a feature slows down a Friday night rush, it doesn't ship.</p>
        </article>
      </section>

      <section class="cta-band">
        <h2>Come run your restaurant on it</h2>
        <p>See the whole system live on your own menu and floor plan.</p>
        <a class="btn" routerLink="/register">Book a demo</a>
      </section>
    </main>
    <app-site-footer />
  `,
  styles: [
    `
      .about {
        max-width: 880px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--primary);
        margin-bottom: 12px;
      }
      .head h1 {
        margin: 0 0 32px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .story p {
        margin: 0 0 16px;
        line-height: 1.8;
        font-size: 1rem;
        color: var(--secondary);
      }
      .values {
        margin-top: 48px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .values article {
        padding: 24px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--on-background) 10%, transparent);
        background: color-mix(in srgb, var(--surface-container) 55%, transparent);
      }
      .values .material-symbols-outlined {
        font-size: 28px;
        color: var(--primary);
      }
      .values h2 {
        margin: 12px 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.0625rem;
      }
      .values p {
        margin: 0;
        color: var(--secondary);
        font-size: 0.9375rem;
        line-height: 1.7;
      }
      .cta-band {
        margin-top: 56px;
        text-align: center;
        padding: 40px 24px;
        border-radius: 24px;
        background: color-mix(in srgb, var(--primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
      }
      .cta-band h2 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.375rem;
      }
      .cta-band p {
        margin: 0 0 20px;
        color: var(--secondary);
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
      @media (min-width: 820px) {
        .values {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `,
  ],
})
export class AboutPageComponent extends SitePageComponent {}
