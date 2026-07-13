import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryApiService } from '@serveiq/shared/data-access';
import { AuditEntry } from '@serveiq/shared/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="audit-page">
      <div class="page-header">
        <div class="title-group">
          <a class="back-link" routerLink="/app/inventory">&larr; Back to Inventory</a>
          <h1 class="page-title">Inventory Audit</h1>
          <p class="page-subtitle">Book vs actual comparison across all tracked items</p>
        </div>
        <button class="btn-refresh" (click)="loadAudit()">Refresh</button>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading() && auditEntries().length === 0" class="empty-state">
        <p>No audit data available.</p>
      </div>

      <div *ngIf="!isLoading() && auditEntries().length > 0" class="audit-table-wrapper">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Initial Stock</th>
              <th>Total Restocked</th>
              <th>Total Sold</th>
              <th>Book Balance</th>
              <th>Actual Balance</th>
              <th>Slippage</th>
              <th>Status</th>
              <th>Last Restock</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of auditEntries()">
              <td class="cell-name">{{ entry.itemName }}</td>
              <td>{{ entry.initialStock }}</td>
              <td>{{ entry.totalRestocked }}</td>
              <td>{{ entry.totalSold }}</td>
              <td>{{ entry.bookBalance }}</td>
              <td>{{ entry.actualBalance }}</td>
              <td [class.text-negative]="entry.slippage < 0" [class.text-positive]="entry.slippage > 0">
                {{ entry.slippage > 0 ? '+' : '' }}{{ entry.slippage }}
              </td>
              <td><span [class]="getStatusClass(entry.status)">{{ entry.status }}</span></td>
              <td>{{ entry.lastRestockDate ? (entry.lastRestockDate | date:'shortDate') : '\u2014' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .audit-page { padding: 24px 32px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .title-group { flex: 1; }
    .back-link { display: inline-block; font-size: 0.875rem; color: var(--primary); text-decoration: none; font-weight: 600; margin-bottom: 8px; }
    .back-link:hover { text-decoration: underline; }
    .page-title { margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--on-surface); }
    .page-subtitle { margin: 0; font-size: 0.9375rem; color: var(--secondary); }
    .btn-refresh { padding: 10px 16px; background: var(--surface-container-low); border: none; border-radius: 8px; color: var(--secondary); font-weight: 600; cursor: pointer; }
    .btn-refresh:hover { background: var(--surface-container-high); color: var(--on-surface); }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--surface-container-low); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 80px 24px; color: var(--secondary); }
    .audit-table-wrapper { overflow-x: auto; }
    .audit-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .audit-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); border-bottom: 2px solid var(--outline-variant); white-space: nowrap; }
    .audit-table td { padding: 12px 16px; border-bottom: 1px solid var(--outline-variant); color: var(--on-surface); }
    .cell-name { font-weight: 600; }
    .text-positive { color: var(--primary); }
    .text-negative { color: #ef4444; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-balanced { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .badge-shortage { background: color-mix(in srgb, #ef4444 15%, transparent); color: #ef4444; }
    .badge-surplus { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #f59e0b; }
    .badge-unreviewed { background: color-mix(in srgb, #94a3b8 15%, transparent); color: #94a3b8; }
  `]
})
export class AuditComponent implements OnInit {
  private inventoryApi = inject(InventoryApiService);

  auditEntries = signal<AuditEntry[]>([]);
  isLoading = signal(true);

  ngOnInit() { this.loadAudit(); }

  loadAudit() {
    this.isLoading.set(true);
    this.inventoryApi.getAudit().subscribe({
      next: (entries) => { this.auditEntries.set(entries); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Balanced': return 'badge badge-balanced';
      case 'Shortage': return 'badge badge-shortage';
      case 'Surplus': return 'badge badge-surplus';
      default: return 'badge badge-unreviewed';
    }
  }
}
