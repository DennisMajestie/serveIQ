import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SitePageComponent } from './site-page';
import { SiteFooterComponent } from './site-footer.component';
import { PageHeaderComponent } from './page-header.component';

interface Section {
  heading: string;
  body: string;
  tips?: string[];
}

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="Guide"
      title="How to Split a Restaurant Bill: 7 Methods Explained"
      subtitle="Splitting a restaurant bill is one of the most common sources of awkwardness at the table. Here are seven practical methods — when each works best, what to watch out for, and how technology is making the whole process painless."
      [breadcrumbs]="[{ label: 'Home', url: '/' }, { label: 'Learn', url: '/' }, { label: 'Bill-Splitting Guide' }]"
    />
    <main class="guide">
      <article class="content">
        @for (section of sections; track section.heading) {
          <section>
            <h2>{{ section.heading }}</h2>
            <p>{{ section.body }}</p>
            @if (section.tips?.length) {
              <ul>
                @for (tip of section.tips; track tip) {
                  <li [innerHTML]="tip"></li>
                }
              </ul>
            }
          </section>
        }
        <section class="easy-way">
          <h2>The easiest way: let each guest pay their own share</h2>
          <p>
            Modern restaurant POS systems like <strong>ServeIQ</strong> let each guest settle their share at the table — by item, amount,
            or percentage. No IOUs, no back-and-forth transfers, no one stuck holding a bill. The tab stays open until every share is
            paid, then closes automatically.
          </p>
          <a class="link" routerLink="/features/split-payments">Learn how ServeIQ split payments work &rarr;</a>
        </section>
      </article>
    </main>
    <app-site-footer />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .guide {
        max-width: 780px;
        margin: 0 auto;
        padding: 56px 24px 80px;
      }
      .content section {
        margin-bottom: 48px;
      }
      .content h2 {
        margin: 0 0 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.3rem;
        color: var(--on-background);
      }
      .content p {
        margin: 0;
        color: var(--secondary);
        font-size: 1rem;
        line-height: 1.85;
      }
      .content ul {
        margin: 12px 0 0;
        padding-left: 22px;
        color: var(--secondary);
        font-size: 0.95rem;
        line-height: 1.8;
      }
      .easy-way {
        padding: 32px;
        border-radius: 20px;
        background: color-mix(in srgb, var(--primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
      }
      .easy-way h2 {
        font-size: 1.2rem;
      }
      .easy-way .link {
        display: inline-block;
        margin-top: 16px;
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
      }
      .easy-way .link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class BillSplittingGuidePageComponent extends SitePageComponent {
  readonly sections: Section[] = [
    {
      heading: '1. Split evenly (50/50 or by headcount)',
      body: 'The simplest approach: divide the total equally among everyone at the table. Fast and fair when everyone ordered roughly the same. Unfair when one person ordered a side salad and everyone else had steak.',
    },
    {
      heading: '2. Split by item',
      body: 'Each person pays for exactly what they ordered — plus their proportional share of service charge and tax. This is the fairest method and the most common source of arguments when done manually. A POS system like ServeIQ can calculate it instantly at the table.',
    },
    {
      heading: '3. Split by fixed amount',
      body: 'Someone says "I\'ll cover exactly ₦5,000" and pays that amount. Good when a guest knows their budget. The remaining balance stays on the tab for others to settle.',
    },
    {
      heading: '4. Split by percentage',
      body: 'Common when one person had drinks and another had food. "I\'ll take 30% of the bill" is quick and works well when the ratio is obvious.',
    },
    {
      heading: '5. One person pays, everyone transfers',
      body: 'The classic: one person puts the whole bill on their card and everyone sends their share via bank transfer. Simple, but hard to track and reconcile — especially at busy restaurants.',
    },
    {
      heading: '6. The "remaining balance" method',
      body: 'Several guests pick off their items or pay fixed amounts, and the last person picks up whatever is left — including service charge and any shared items. Works well when there\'s a clear "host" of the table.',
    },
    {
      heading: '7. Rotate who pays',
      body: 'Friends and regulars take turns covering the full bill across visits. No splitting at the table at all. Works best for small groups who eat together often and trust each other.',
      tips: [
        'Decide the method <strong>before</strong> ordering when possible.',
        'Always clarify whether shared items (appetizers, bottles) are split evenly or by the people who touched them.',
        'If you\'re hosting, say so at the start — don\'t announce it at the end and create confusion.',
        'Use a POS or payment system that does the math — it removes the social friction entirely.',
        'In Nigeria and West Africa, bank transfer and USSD splits are common. A system like ServeIQ can settle each guest independently at the table.',
      ],
    },
  ];
}