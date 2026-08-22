import { Component } from '@angular/core';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';

@Component({
  standalone: true,
  imports: [SiteFooterComponent],
  template: `
    <main class="legal">
      <header class="legal-head">
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: August 2026</p>
      </header>

      <section>
        <h2>1. Who we are</h2>
        <p>
          ServeIQ ("we", "us") provides restaurant operations software — point of sale,
          kitchen display, table and tab management, inventory, staff management, analytics
          and payments — to restaurants across Nigeria. This policy explains how we handle
          personal data of (a) restaurant owners, managers and staff who use our platform
          ("Platform Users") and (b) end customers who interact with menus, orders or
          payments processed through our platform ("End Customers").
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <ul>
          <li><strong>Account data</strong> — name, email address, phone number, business name and business code.</li>
          <li><strong>Staff data</strong> — staff names, roles, and hashed PINs used for waiter/supervisor/chef logins. PINs are never stored in plain text.</li>
          <li><strong>Business & operational data</strong> — menu items, prices, orders, bills, tabs, tables, shifts, stock counts and supplier records you enter into the system.</li>
          <li><strong>Payment data</strong> — payment references, amounts and statuses from providers such as Paystack, Moniepoint and OPay. We do not store card numbers or bank credentials on our servers.</li>
          <li><strong>Device & usage data</strong> — device identifiers bound to your login session, app version, IP address and diagnostic logs used to secure accounts.</li>
          <li><strong>Support data</strong> — messages and category you submit through the in-app feedback form, together with the page URL and user agent at time of submission.</li>
        </ul>
      </section>

      <section>
        <h2>3. How we use data</h2>
        <ul>
          <li>To operate the service: process orders, bills, payments, tabs and inventory.</li>
          <li>To secure accounts: authenticate users, bind sessions to devices, detect abuse and rate-limit attacks.</li>
          <li>To provide analytics to restaurant owners about their own sales, efficiency and staff performance.</li>
          <li>To communicate service updates, billing notices and support responses.</li>
          <li>To comply with legal obligations, including tax and accounting requirements.</li>
        </ul>
        <p>We do not sell personal data, and we do not use restaurant operational data to advertise to End Customers.</p>
      </section>

      <section>
        <h2>4. Security</h2>
        <p>
          Data is transmitted over TLS and stored on managed PostgreSQL infrastructure.
          Sensitive fields are encrypted at rest using AES-256-GCM with a dedicated key.
          Access tokens are short-lived; refresh tokens are bound to specific devices and
          can be revoked by administrators. Administrative access to production data is
          restricted and logged.
        </p>
      </section>

      <section>
        <h2>5. Sharing & processors</h2>
        <p>
          We share data only with processors needed to run the service: cloud hosting and
          database providers, payment processors (Paystack, Moniepoint, OPay), error
          monitoring, and email/notification delivery. Each processes data solely on our
          instructions. We may disclose data where required by law or to protect the
          rights, property or safety of ServeIQ, our customers or their patrons.
        </p>
      </section>

      <section>
        <h2>6. Retention</h2>
        <p>
          Operational records (orders, bills, payments) are retained for as long as your
          account is active and for seven years thereafter to meet accounting obligations.
          Account and staff records are deleted or anonymised within 90 days of verified
          account closure, except where law requires longer retention.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          Subject to the Nigeria Data Protection Act 2023 (NDPA) and applicable laws, you
          may request access to, correction of, or deletion of your personal data; object
          to certain processing; and lodge a complaint with the Nigeria Data Protection
          Commission. Business owners control the data of their staff; requests from staff
          will be routed through the owning business where appropriate.
        </p>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>ServeIQ is not directed at individuals under 18, and we do not knowingly collect their data.</p>
      </section>

      <section>
        <h2>9. Changes & contact</h2>
        <p>
          We will notify material changes to this policy via the app or email. Questions
          or requests can be sent to
          <a href="mailto:privacy@serveiq.io">privacy&#64;serveiq.io</a>.
        </p>
      </section>
    </main>
    <app-site-footer />
  `,
  styles: [
    `
      .legal {
        max-width: 820px;
        margin: 0 auto;
        padding: 48px 24px 80px;
      }
      .legal-head h1 {
        margin: 0 0 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 2rem;
        letter-spacing: -0.02em;
      }
      .updated {
        margin: 0 0 36px;
        color: var(--secondary);
        font-size: 0.875rem;
      }
      section {
        margin-bottom: 32px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--on-background);
      }
      p,
      li {
        margin: 0 0 10px;
        line-height: 1.7;
        font-size: 0.9375rem;
        color: var(--secondary);
      }
      ul {
        margin: 0;
        padding-left: 20px;
      }
      strong {
        color: var(--on-background);
      }
      a {
        color: var(--primary);
      }
    `,
  ],
})
export class PrivacyPageComponent extends SitePageComponent {}
