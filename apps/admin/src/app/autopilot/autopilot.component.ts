import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-autopilot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="autopilot-canvas">
      <h2>Autopilot</h2>
      <p>Autonomous venue management system.</p>
    </div>
  `,
  styles: [`
    .autopilot-canvas {
      padding: 32px;
    }
    h2 {
      font-size: 32px;
      font-weight: 700;
      color: var(--on-background);
      margin: 0 0 8px;
    }
    p {
      font-size: 16px;
      color: var(--secondary);
      margin: 0;
    }
  `]
})
export class AutopilotComponent {}
