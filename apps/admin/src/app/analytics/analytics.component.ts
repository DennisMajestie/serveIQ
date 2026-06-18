import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface AnalyticsMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

interface StaffPerformance {
  name: string;
  role: string;
  sales: number;
  efficiency: number;
  avatar: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="analytics-page">
      <!-- High-Level KPI Row -->
      <section class="metrics-bento">
        <article class="metric-card" *ngFor="let metric of kpiMetrics()">
          <div class="metric-icon-box" [style.background]="metric.color + '15'">
            <mat-icon [style.color]="metric.color">{{ metric.icon }}</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-label inter-font">{{ metric.label }}</span>
            <div class="metric-row">
              <span class="metric-value space-font">{{ metric.value }}</span>
              <span class="metric-trend" [class.up]="metric.trend === 'up'" [class.down]="metric.trend === 'down'">
                <mat-icon>{{ metric.trend === 'up' ? 'trending_up' : 'trending_down' }}</mat-icon>
                <span>{{ metric.change }}</span>
              </span>
            </div>
          </div>
        </article>
      </section>

      <!-- Main Analytics Grid -->
      <div class="analytics-grid">
        <!-- Left Col: Revenue & ROI (2/3) -->
        <div class="primary-col">
          <!-- Category ROI Card -->
          <article class="luminous-card category-card">
            <div class="card-header">
              <h2 class="card-title space-font">Category ROI Breakdown</h2>
              <button class="icon-btn-sm"><mat-icon>more_vert</mat-icon></button>
            </div>
            <div class="category-viz">
              <div class="radial-container">
                <svg viewBox="0 0 100 100" class="radial-chart">
                  <circle cx="50" cy="50" r="45" class="bg-circle" />
                  <circle cx="50" cy="50" r="45" class="fg-circle food" [style.stroke-dasharray]="'180 283'" />
                  <circle cx="50" cy="50" r="45" class="fg-circle drinks" [style.stroke-dasharray]="'70 283'" [style.stroke-dashoffset]="'-180'" />
                </svg>
                <div class="radial-center">
                  <span class="total-label inter-font">Avg. Margin</span>
                  <span class="total-value space-font">68%</span>
                </div>
              </div>
              <div class="category-legend">
                <div class="legend-item" *ngFor="let cat of categoryROI()">
                  <span class="dot" [style.background]="cat.color"></span>
                  <div class="legend-info">
                    <span class="cat-name inter-font">{{ cat.name }}</span>
                    <span class="cat-val space-font">₦{{ cat.value }}</span>
                  </div>
                  <span class="cat-perc inter-font">{{ cat.percentage }}%</span>
                </div>
              </div>
            </div>
          </article>

          <!-- Revenue Trend Chart -->
          <article class="luminous-card trend-card">
            <div class="card-header">
              <h2 class="card-title space-font">Revenue vs Forecast</h2>
              <div class="legend-simple">
                <span class="legend-badge current inter-font">Current</span>
                <span class="legend-badge forecast inter-font">Forecast</span>
              </div>
            </div>
            <div class="trend-viz">
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" class="pulse-chart">
                  <path class="area-fill" d="M0,180 Q150,140 300,160 Q450,180 600,60 L600,200 L0,200 Z" fill="url(#neonGradient)" />
                  <path class="line-trace" d="M0,180 Q150,140 300,160 Q450,180 600,60" stroke="#00D166" stroke-width="4" fill="none" />
                  <defs>
                    <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#00D166" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#00D166" stop-opacity="0" />
                    </linearGradient>
                  </defs>
              </svg>
            </div>
          </article>
        </div>

        <!-- Right Col: Staff Efficiency (1/3) -->
        <div class="secondary-col">
          <article class="luminous-card leaderboard-card">
            <div class="card-header">
              <h2 class="card-title space-font">Staff Performance</h2>
              <a class="view-all inter-font">Leaderboard</a>
            </div>
            <div class="staff-list">
              <div class="staff-row" *ngFor="let staff of staffData()">
                <div class="staff-avatar" [style.background]="staff.avatar">
                  {{ staff.name.charAt(0) }}
                </div>
                <div class="staff-main">
                  <span class="staff-name space-font">{{ staff.name }}</span>
                  <span class="staff-role inter-font">{{ staff.role }}</span>
                </div>
                <div class="staff-metrics">
                  <span class="staff-sales space-font">₦{{ staff.sales }}k</span>
                  <div class="efficiency-bar">
                    <div class="bar-fill" [style.width.%]="staff.efficiency"></div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- Operational Insights -->
          <article class="luminous-card insight-card">
            <div class="insight-header">
              <mat-icon>auto_awesome</mat-icon>
              <h3 class="space-font">Operational Insights</h3>
            </div>
            <ul class="insight-list">
              <li class="inter-font">High volume detected in <strong>Section B</strong>.</li>
              <li class="inter-font">Top item: <strong>Grilled Sea Bass</strong>.</li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --surface-low: #eff4ff;
      --on-surface: #0b1c30;
      --on-surface-muted: #64748b;
      --primary: #00D166;
      --secondary: #0059bb;
      --radius-lg: 20px;
      --radius-xl: 32px;
    }

    .analytics-page { padding: 40px; display: flex; flex-direction: column; gap: 32px; }

    .metrics-bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .metric-card { background: white; border-radius: var(--radius-lg); padding: 24px; display: flex; gap: 16px; box-shadow: 0 8px 32px rgba(11,28,48,0.03); }
    .metric-icon-box { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .metric-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .metric-label { font-size: 0.8125rem; font-weight: 500; color: var(--on-surface-muted); }
    .metric-row { display: flex; align-items: baseline; gap: 12px; }
    .metric-value { font-size: 1.5rem; color: var(--on-surface); }
    .metric-trend { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; }
    .metric-trend.up { color: #00D166; }
    .metric-trend.down { color: #FF7043; }

    .analytics-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; }
    .primary-col, .secondary-col { display: flex; flex-direction: column; gap: 32px; }

    .luminous-card { background: white; border-radius: var(--radius-xl); padding: 32px; box-shadow: 0 12px 48px rgba(11,28,48,0.04); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .card-title { font-size: 1.25rem; margin: 0; color: var(--on-surface); }

    .category-viz { display: flex; align-items: center; gap: 48px; }
    .radial-container { position: relative; width: 180px; height: 180px; }
    .radial-chart { transform: rotate(-90deg); width: 100%; height: 100%; }
    .bg-circle { fill: none; stroke: var(--surface-low); stroke-width: 8; }
    .fg-circle { fill: none; stroke-width: 8; stroke-linecap: round; }
    .fg-circle.food { stroke: var(--primary); }
    .fg-circle.drinks { stroke: var(--secondary); }
    .radial-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; display: flex; flex-direction: column; }
    .total-label { font-size: 0.7rem; color: var(--on-surface-muted); text-transform: uppercase; }
    .total-value { font-size: 1.75rem; color: var(--on-surface); }

    .category-legend { flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .legend-item { display: flex; align-items: center; gap: 16px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-info { flex: 1; display: flex; flex-direction: column; }
    .cat-name { font-size: 0.9375rem; font-weight: 600; }
    .cat-val { font-size: 0.8125rem; color: var(--on-surface-muted); }
    .cat-perc { font-weight: 700; color: var(--on-surface); }

    .trend-viz { height: 200px; width: 100%; margin-top: 24px; position: relative; overflow: hidden; border-radius: 12px; }
    .pulse-chart { width: 100%; height: 100%; }
    .line-trace { filter: drop-shadow(0 4px 12px rgba(0, 209, 102, 0.4)); }

    .staff-list { display: flex; flex-direction: column; gap: 16px; }
    .staff-row { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; background: var(--surface-low); }
    .staff-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; }
    .staff-main { flex: 1; display: flex; flex-direction: column; }
    .staff-name { font-size: 0.9375rem; font-weight: 700; }
    .staff-role { font-size: 0.7rem; color: var(--on-surface-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .staff-metrics { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .staff-sales { font-size: 0.875rem; font-weight: 700; color: var(--secondary); }
    .efficiency-bar { width: 60px; height: 4px; background: rgba(0,0,0,0.05); border-radius: 2px; }
    .bar-fill { height: 100%; background: var(--primary); border-radius: 2px; }

    .insight-card { background: #fff8e1; border: none; }
    .insight-header { display: flex; align-items: center; gap: 12px; color: #f57c00; margin-bottom: 16px; }
    .insight-header h3 { margin: 0; font-size: 1.125rem; }
    .insight-list { padding-left: 20px; margin: 0; }
    .insight-list li { color: #5d4037; font-size: 0.875rem; margin-bottom: 8px; line-height: 1.5; }
  `]
})
export class AnalyticsComponent {
  kpiMetrics = signal<AnalyticsMetric[]>([
    { label: 'Total Revenue', value: '₦4,840k', change: '+12.4%', trend: 'up', icon: 'payments', color: '#00D166' },
    { label: 'Avg Ticket', value: '₦8,450', change: '+5.2%', trend: 'up', icon: 'receipt', color: '#0059bb' },
    { label: 'Turnover Rate', value: '42m', change: '-4m', trend: 'up', icon: 'speed', color: '#8b5cf6' },
    { label: 'Cancel Rate', value: '1.2%', change: '+0.4%', trend: 'down', icon: 'cancel', color: '#FF7043' }
  ]);

  categoryROI = signal([
    { name: 'Food & Entrees', value: '3,240,500', percentage: 65, color: '#00D166' },
    { name: 'Beverages', value: '1,120,000', percentage: 22, color: '#0059bb' },
    { name: 'Desserts', value: '479,500', percentage: 13, color: '#FF7043' }
  ]);

  staffData = signal<StaffPerformance[]>([
    { name: 'Sarah Miller', role: 'Main Section', sales: 452, efficiency: 94, avatar: '#00D166' },
    { name: 'Marcus Chen', role: 'Patio', sales: 398, efficiency: 88, avatar: '#0059bb' },
    { name: 'Elena Rodriguez', role: 'Bar', sales: 312, efficiency: 91, avatar: '#8b5cf6' }
  ]);
}
