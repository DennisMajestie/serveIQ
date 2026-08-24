import { Component } from '@angular/core';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

@Component({
  standalone: true,
  imports: [SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      title="Terms of Service"
      subtitle="Last updated: August 2026"
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Terms' }]"
    />
    <main class="legal">

      <section>
        <h2>1. Agreement</h2>
        <p>
          These terms govern your use of the ServeIQ platform — including the admin web
          app, waiter mobile app, public QR menu, and related APIs (together, the
          "Service"). By creating an account or using the Service you agree to these
          terms on behalf of yourself and the business you represent, and confirm you
          are authorised to bind that business.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <ul>
          <li>You must provide accurate business information and keep credentials secure.</li>
          <li>You are responsible for all activity under your account, including staff PINs you issue.</li>
          <li>Notify us immediately at <a href="mailto:support&#64;serveiq.io">support&#64;serveiq.io</a> if you suspect unauthorised access.</li>
        </ul>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <ul>
          <li>Use the Service only for lawful restaurant operations in Nigeria.</li>
          <li>Do not attempt to access other businesses' data, probe or overload the platform, reverse-engineer it, or bypass its security controls (including payment webhook verification).</li>
          <li>Do not resell or provide the Service to third parties without a written agreement with us.</li>
        </ul>
      </section>

      <section>
        <h2>4. Payments & billing</h2>
        <ul>
          <li>Customer payments through the Service are processed by third-party processors (Paystack, Moniepoint, OPay) under their own terms. We do not hold customer funds.</li>
          <li>Subscription fees, plans and trial terms are presented at checkout or in-app before purchase. Fees are charged in advance and are non-refundable except where required by law.</li>
          <li>We may suspend accounts for non-payment after notice.</li>
        </ul>
      </section>

      <section>
        <h2>5. Service availability</h2>
        <p>
          We aim for high availability but provide the Service "as is" during the beta
          period without warranties of uninterrupted operation. Scheduled maintenance and
          provider outages may cause downtime; we will communicate known material outages
          in-app where practical.
        </p>
      </section>

      <section>
        <h2>6. Data & intellectual property</h2>
        <ul>
          <li><strong>Your data:</strong> You own your business's operational data. You grant us a limited licence to process it to operate and secure the Service.</li>
          <li><strong>Our platform:</strong> The Service, its software and branding remain our property. No rights are transferred except as expressly stated.</li>
          <li><strong>Feedback:</strong> You grant us a perpetual, royalty-free licence to use suggestions you submit to improve the Service.</li>
        </ul>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, ServeIQ is not liable for indirect,
          incidental or consequential damages, lost profits, or lost goodwill. Our total
          liability for any claim is limited to the fees you paid us in the twelve months
          preceding the claim.
        </p>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>
          You may stop using the Service and close your account at any time. We may
          suspend or terminate accounts that breach these terms, on notice where
          practicable. On closure we handle data per Section 6 of our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>9. Governing law & changes</h2>
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria.
          Material changes will be communicated via the app or email; continued use after
          changes take effect constitutes acceptance.
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
      section {
        margin-bottom: 32px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 1.125rem;
        font-weight: 700;
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
export class TermsPageComponent extends SitePageComponent {}
