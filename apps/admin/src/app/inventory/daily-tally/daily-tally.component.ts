import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '@serveiq/shared/data-access';
import { DailyTallyReport } from '@serveiq/shared/models';

@Component({
  selector: 'app-daily-tally',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="tally-page">
      <div class="page-header">
        <div class="title-group">
          <a class="back-link" routerLink="/app/inventory">&larr; Back to Inventory</a>
          <h1 class="page-title">Daily Tally</h1>
          <p class="page-subtitle">Opening/closing stock reconciliation for a given date</p>
        </div>
        <div class="header-actions">
          <div class="date-picker-group">
            <label class="date-label" for="tally-date">Date</label>
            <input type="date" id="tally-date" class="date-input" [value]="selectedDate()" (change)="selectedDate.set($any($event.target).value); loadTally()">
          </div>
          <button class="btn-refresh" (click)="loadTally()">Refresh</button>
        </div>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!isLoading() && report() as report">
        <div class="tally-summary">
          <div class="summary-card" *ngFor="let stat of summaryStats(report)">
            <span class="summary-label">{{ stat.label }}</span>
            <span class="summary-value" [class.text-positive]="stat.highlight === 'positive'" [class.text-negative]="stat.highlight === 'negative'">{{ stat.value }}</span>
          </div>
        </div>

        <div *ngIf="report.items.length === 0" class="empty-state">
          <p>No data for this date.</p>
        </div>

        <div *ngIf="report.items.length > 0" class="tally-table-wrapper">
          <table class="tally-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Opening</th>
                <th>Restocked</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Revenue</th>
                <th>Unit Price</th>
                <th>Tally</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of report.items">
                <td class="cell-name">{{ item.itemName }}</td>
                <td>{{ item.openingStock }}</td>
                <td>{{ item.restockedToday }}</td>
                <td>{{ item.soldToday }}</td>
                <td>{{ item.closingStock }}</td>
                <td>{{ formatCurrency(item.revenueToday) }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>
                  <span class="tally-badge" [class.tally-valid]="item.isTallyValid" [class.tally-invalid]="!item.isTallyValid">
                    {{ item.isTallyValid ? 'Valid' : 'Invalid' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <div *ngIf="!isLoading() && !report()" class="empty-state">
        <p>Loading daily tally...</p>
      </div>
    </div>
  `,
  styles: [`
    .tally-page { padding: 24px 32px; max-width: 1400px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .title-group { flex: 1; }
    .back-link { display: inline-block; font-size: 0.875rem; color: var(--primary); text-decoration: none; font-weight: 600; margin-bottom: 8px; }
    .back-link:hover { text-decoration: underline; }
    .page-title { margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--on-surface); }
    .page-subtitle { margin: 0; font-size: 0.9375rem; color: var(--secondary); }
    .header-actions { display: flex; align-items: flex-end; gap: 12px; }
    .date-picker-group { display: flex; flex-direction: column; gap: 4px; }
    .date-label { font-size: 0.75rem; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .date-input { padding: 10px 14px; border: 1.5px solid var(--outline-variant); border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.9375rem; color: var(--on-surface); outline: none; }
    .date-input:focus { border-color: var(--primary); }
    .btn-refresh { padding: 10px 16px; background: var(--surface-container-low); border: none; border-radius: 8px; color: var(--secondary); font-weight: 600; cursor: pointer; height: 42px; }
    .btn-refresh:hover { background: var(--surface-container-high); color: var(--on-surface); }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--surface-container-low); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 80px 24px; color: var(--secondary); }

    .tally-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .summary-card { padding: 20px; background: var(--surface-container-lowest); border: 1px solid var(--outline-variant); border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .summary-label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); margin-bottom: 8px; }
    .summary-value { font-size: 1.25rem; font-weight: 700; color: var(--on-surface); }
    .text-positive { color: var(--primary); }
    .text-negative { color: #ef4444; }

    .tally-table-wrapper { overflow-x: auto; }
    .tally-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .tally-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); border-bottom: 2px solid var(--outline-variant); white-space: nowrap; }
    .tally-table td { padding: 12px 16px; border-bottom: 1px solid var(--outline-variant); color: var(--on-surface); }
    .cell-name { font-weight: 600; }
    .tally-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .tally-valid { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .tally-invalid { background: color-mix(in srgb, #ef4444 15%, transparent); color: #ef4444; }
  `]
})
export class DailyTallyComponent implements OnInit {
  private inventoryApi = inject(InventoryApiService);

  selectedDate = signal(new Date().toISOString().split('T')[0]);
  report = signal<DailyTallyReport | null>(null);
  isLoading = signal(true);

  ngOnInit() { this.loadTally(); }

  loadTally() {
    this.isLoading.set(true);
    this.report.set(null);
    this.inventoryApi.getDailyTally(this.selectedDate()).subscribe({
      next: (r) => { this.report.set(r); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  summaryStats(report: DailyTallyReport | null) {
    if (!report?.summary) return [];
    const s = report.summary;
    return [
      { label: 'Date', value: s.date || '\u2014', highlight: '' },
      { label: 'Opening Value', value: this.formatCurrency(s.totalOpeningValue), highlight: '' },
      { label: 'Revenue', value: this.formatCurrency(s.totalRevenue), highlight: 'positive' },
      { label: 'Closing Value', value: this.formatCurrency(s.totalClosingValue), highlight: '' },
      { label: 'Items Sold', value: `${s.totalItemsSold ?? '\u2014'}`, highlight: '' },
      { label: 'Items Restocked', value: `${s.totalItemsRestocked ?? '\u2014'}`, highlight: '' },
      { label: 'All Balanced', value: s.isAllBalanced ? 'Yes' : 'No', highlight: s.isAllBalanced ? 'positive' : 'negative' },
    ];
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '\u2014';
    return (amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
