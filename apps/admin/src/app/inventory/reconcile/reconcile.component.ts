import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '@serveiq/shared/data-access';
import { MenuItem, ReconcileRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reconcile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reconcile-page">
      <div class="page-header">
        <div class="title-group">
          <a class="back-link" routerLink="/app/inventory">&larr; Back to Inventory</a>
          <h1 class="page-title">Reconcile Stock</h1>
          <p class="page-subtitle">Enter physical counts for each item. Differences will be recorded as adjustments.</p>
        </div>
        <div class="header-actions">
          <span class="reconcile-id">ID: {{ reconcileId().slice(0, 8) }}...</span>
          <button class="btn-primary" (click)="submitReconcile()" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Submitting...' : 'Submit Counts' }}
          </button>
        </div>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading() && reconcileCounts().length === 0" class="empty-state">
        <p>No inventory items to reconcile.</p>
      </div>

      <div *ngIf="!isLoading() && reconcileCounts().length > 0" class="reconcile-list">
        <div class="reconcile-header">
          <span class="col-name">Item</span>
          <span class="col-book">Book</span>
          <span class="col-physical">Physical Count</span>
          <span class="col-delta">Delta</span>
        </div>
        <div class="reconcile-row" *ngFor="let c of reconcileCounts()">
          <span class="col-name">{{ c.itemName }}</span>
          <span class="col-book">{{ c.bookCount }}</span>
          <input type="number" class="form-input col-physical" [value]="c.physicalCount" (change)="c.physicalCount = $any($event.target).valueAsNumber" min="0">
          <span class="col-delta" [class.text-positive]="c.physicalCount > c.bookCount" [class.text-negative]="c.physicalCount < c.bookCount">
            {{ c.physicalCount - c.bookCount > 0 ? '+' : '' }}{{ c.physicalCount - c.bookCount }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reconcile-page { padding: 24px 32px; margin: 0 auto; font-family: 'Inter', sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .title-group { flex: 1; }
    .back-link { display: inline-block; font-size: 0.875rem; color: var(--primary); text-decoration: none; font-weight: 600; margin-bottom: 8px; }
    .back-link:hover { text-decoration: underline; }
    .page-title { margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--on-surface); }
    .page-subtitle { margin: 0; font-size: 0.9375rem; color: var(--secondary); }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .reconcile-id { font-size: 0.75rem; color: var(--secondary); font-family: monospace; }
    .btn-primary { padding: 10px 20px; background: var(--primary); color: var(--on-primary); border: none; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--primary) 85%, black); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-state { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 48px; height: 48px; border: 4px solid var(--surface-container-low); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 80px 24px; color: var(--secondary); }
    .reconcile-list { border: 1px solid var(--outline-variant); border-radius: 12px; overflow: hidden; }
    .reconcile-header { display: grid; grid-template-columns: 2fr 80px 1fr 80px; gap: 12px; padding: 14px 20px; background: var(--surface-container-low); font-size: 0.75rem; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .reconcile-row { display: grid; grid-template-columns: 2fr 80px 1fr 80px; gap: 12px; padding: 12px 20px; align-items: center; border-top: 1px solid var(--outline-variant); font-size: 0.9375rem; color: var(--on-surface); }
    .col-name { font-weight: 600; }
    .col-book { text-align: center; color: var(--secondary); }
    .col-physical { text-align: center; }
    .col-delta { text-align: center; font-weight: 700; }
    .form-input { width: 100%; padding: 8px 12px; border: 1.5px solid var(--outline-variant); border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.9375rem; color: var(--on-surface); outline: none; box-sizing: border-box; text-align: center; }
    .form-input:focus { border-color: var(--primary); }
    .text-positive { color: var(--primary); }
    .text-negative { color: #ef4444; }
  `]
})
export class ReconcileComponent implements OnInit {
  private inventoryApi = inject(InventoryApiService);

  inventory = signal<MenuItem[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  reconcileId = signal(crypto.randomUUID());
  reconcileCounts = signal<{ menuItemId: string; itemName: string; bookCount: number; physicalCount: number }[]>([]);

  ngOnInit() {
    this.inventoryApi.list().subscribe({
      next: (items) => {
        this.inventory.set(items);
        this.reconcileCounts.set(
          items.map(item => ({
            menuItemId: item.id,
            itemName: item.name,
            bookCount: item.quantityInStock,
            physicalCount: item.quantityInStock,
          }))
        );
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  submitReconcile() {
    this.isSubmitting.set(true);
    const payload: ReconcileRequest = {
      reconciliation_id: this.reconcileId(),
      counts: this.reconcileCounts().map(c => ({ menu_item_id: c.menuItemId, physical_count: c.physicalCount })),
    };
    this.inventoryApi.reconcile(payload).subscribe({
      next: (result) => {
        const adjustments = result.adjustments.map(a => {
          const itemName = this.inventory().find(i => i.id === a.menuItemId)?.name || a.menuItemId;
          return `${a.delta > 0 ? '+' : ''}${a.delta} for ${itemName}`;
        }).join('<br>');
        Swal.fire({
          icon: 'success', title: 'Reconciled',
          html: `Adjustments applied:<br>${adjustments || 'None needed'}`,
        });
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
        Swal.fire({ icon: 'error', title: 'Reconciliation failed' });
      }
    });
  }
}
