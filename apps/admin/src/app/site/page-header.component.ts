import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PageHeaderCrumb {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header
      class="page-header"
      [style.background-image]="
        'linear-gradient(180deg, rgba(8,10,18,0.62), rgba(8,10,18,0.82)), url(' +
        image() +
        ')'
      "
    >
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
            @if (crumb.url) {
              <a class="crumb" [routerLink]="crumb.url">{{ crumb.label }}</a>
            } @else {
              <span class="crumb current" aria-current="page">{{ crumb.label }}</span>
            }
            @if (!last) {
              <span class="sep" aria-hidden="true">/</span>
            }
          }
        </nav>
        @if (eyebrow()) {
          <span class="eyebrow">{{ eyebrow() }}</span>
        }
        <h1 class="title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page-header {
        position: relative;
        background-color: #0c0f17;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        color: #fff;
        padding: 92px 24px 64px;
      }
      .container {
        max-width: 1040px;
        margin: 0 auto;
      }
      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: 0 0 18px;
        font-size: 0.8125rem;
      }
      .crumb {
        color: rgba(255, 255, 255, 0.72);
        text-decoration: none;
        transition: color 0.2s ease;
      }
      .crumb:hover {
        color: #fff;
      }
      .crumb.current {
        color: #fff;
        font-weight: 600;
      }
      .sep {
        color: rgba(255, 255, 255, 0.4);
      }
      .eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(255, 255, 255, 0.9);
      }
      .title {
        margin: 0;
        max-width: 20ch;
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        line-height: 1.15;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 14px 0 0;
        max-width: 620px;
        font-size: 1rem;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.82);
      }
      @media (min-width: 720px) {
        .page-header {
          padding: 104px 24px 72px;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly subtitle = input<string>('');
  readonly image = input<string>('/assets/brand/hero-2.jpg');
  readonly breadcrumbs = input<PageHeaderCrumb[]>([{ label: 'Home', url: '/' }]);
}
