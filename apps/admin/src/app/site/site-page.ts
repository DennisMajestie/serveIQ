import { Component, Inject, PLATFORM_ID, Signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService, Theme } from '../core/theme.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="site-topbar">
      <a routerLink="/" class="site-brand">
        <img [src]="theme() === 'dark' ? 'assets/brand/serveiq-dark-logo.png' : 'assets/brand/serveiq-logo.png'" alt="ServeIQ" />
      </a>
      <a routerLink="/" class="site-back">
        <span class="material-symbols-outlined">arrow_back</span>Back to home
      </a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--background);
        color: var(--on-background);
        font-family: 'Inter', sans-serif;
      }
      .site-topbar {
        position: sticky;
        top: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 24px;
        border-bottom: 1px solid color-mix(in srgb, var(--on-background) 8%, transparent);
        background: color-mix(in srgb, var(--background) 88%, transparent);
        backdrop-filter: blur(12px);
      }
      .site-brand img {
        height: 3rem;
        width: auto;
        object-fit: contain;
        display: block;
      }
      .site-back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.2s;
      }
      .site-back:hover {
        color: var(--primary);
      }
      .site-back .material-symbols-outlined {
        font-size: 18px;
      }
    `,
  ],
})
export abstract class SitePageComponent {
  readonly theme: Signal<Theme>;
  protected platformId = inject(PLATFORM_ID);

  constructor() {
    this.theme = inject(ThemeService).theme;
  }

  protected get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
