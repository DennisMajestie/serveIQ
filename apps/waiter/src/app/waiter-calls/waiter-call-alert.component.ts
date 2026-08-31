import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WaiterCallAlertService } from './waiter-call-alert.service';
import { OfflineDataService } from '../services/offline-data.service';

@Component({
  selector: 'app-waiter-call-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alert.alertVisible()) {
      <div class="wc-alert" role="alert">
        <div class="wc-alert-icon">🔔</div>
        <div class="wc-alert-body">
          <div class="wc-alert-title">New waiter call</div>
          <div class="wc-alert-sub">{{ tableLabel() }}</div>
        </div>
        <div class="wc-alert-actions">
          <button class="wc-alert-btn view" (click)="view()">View</button>
          <button class="wc-alert-btn dismiss" (click)="alert.dismiss()">✕</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .wc-alert {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5000;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #0f172a;
      border: 1px solid rgba(75, 226, 119, 0.4);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      padding: 12px 16px;
      max-width: calc(100vw - 32px);
      animation: wc-slide 0.25s ease-out;
    }
    .wc-alert-icon {
      font-size: 26px;
      animation: wc-bell 1s infinite;
    }
    .wc-alert-body { flex: 1; min-width: 0; }
    .wc-alert-title { color: #4be277; font-size: 15px; font-weight: 700; }
    .wc-alert-sub { color: #bccbb9; font-size: 12px; }
    .wc-alert-actions { display: flex; align-items: center; gap: 8px; }
    .wc-alert-btn { border: none; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .wc-alert-btn.view { background: #4be277; color: #020617; }
    .wc-alert-btn.dismiss { background: rgba(255, 255, 255, 0.1); color: #bccbb9; }
    @keyframes wc-slide { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
    @keyframes wc-bell { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-15deg); } 60% { transform: rotate(10deg); } 80% { transform: rotate(-10deg); } }
  `],
})
export class WaiterCallAlertComponent {
  protected alert = inject(WaiterCallAlertService);
  private router = inject(Router);
  private offlineData = inject(OfflineDataService);
  private labelCache = new Map<string, string>();
  private label = signal<string>('A guest needs a waiter');

  constructor() {
    this.offlineData.getTables().subscribe({
      next: (tables) => {
        for (const t of tables || []) {
          if (t.id) this.labelCache.set(t.id, t.label || `Table ${t.tableNumber}`);
        }
        this.refreshLabel();
      },
    });
  }

  private refreshLabel() {
    const id = this.alert.incoming()?.tableId;
    if (!id) return;
    const cached = this.labelCache.get(id);
    this.label.set(cached ? `${cached} needs a waiter` : 'A guest needs a waiter');
  }

  tableLabel(): string {
    this.refreshLabel();
    return this.label();
  }

  view() {
    const id = this.alert.incoming()?.id;
    this.alert.dismiss();
    if (id) this.alert.resetFor(id);
    this.router.navigate(['/waiter-calls']);
  }
}

