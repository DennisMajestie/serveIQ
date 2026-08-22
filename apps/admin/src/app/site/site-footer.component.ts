import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="inner">
        <p class="copy">© {{ year }} ServeIQ. The software powering great restaurants.</p>
        <nav class="links">
          <a routerLink="/privacy">Privacy Policy</a>
          <span></span>
          <a routerLink="/terms">Terms of Service</a>
          <span></span>
          <a routerLink="/contact">Contact</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
      .site-footer {
        border-top: 1px solid color-mix(in srgb, var(--on-background) 8%, transparent);
        margin-top: 40px;
      }
      .inner {
        max-width: 820px;
        margin: 0 auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .copy {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--secondary);
      }
      .links {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.8125rem;
      }
      .links a {
        color: var(--secondary);
        text-decoration: none;
      }
      .links a:hover {
        color: var(--primary);
      }
      span {
        width: 1px;
        height: 12px;
        background: color-mix(in srgb, var(--on-background) 20%, transparent);
      }
    `,
  ],
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
}
