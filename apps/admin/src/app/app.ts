import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
export class App {}
