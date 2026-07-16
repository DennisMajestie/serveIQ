import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  template: `
    <div class="supervisor-app">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .supervisor-app {
      min-height: 100vh;
      background-color: var(--background);
    }
  `]
})
export class App {}
