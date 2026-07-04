import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-app">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .admin-app {
      min-height: 100vh;
      background-color: #f8fafc;
    }
  `]
})
export class App implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    if ('fonts' in document) {
      (document as any).fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    } else {
      setTimeout(() => {
        document.body.classList.add('fonts-loaded');
      }, 300);
    }
  }
}
