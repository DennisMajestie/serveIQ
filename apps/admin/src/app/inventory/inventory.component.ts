import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { InventoryApiService, SuppliersApiService } from '@serveiq/shared/data-access';
import { MenuItem, Supplier, RestockRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private inventoryApi = inject(InventoryApiService);
  private suppliersApi = inject(SuppliersApiService);
  private router = inject(Router);

  inventory = signal<MenuItem[]>([]);
  suppliers = signal<Supplier[]>([]);
  isLoading = signal(true);
  lowStockOnly = signal(false);
  showUntracked = signal(false);
  untrackedItems = signal<MenuItem[]>([]);
  isLoadingUntracked = signal(false);

  filteredInventory = computed(() => {
    const items = this.inventory();
    if (!this.lowStockOnly()) return items;
    return items.filter(i => i.quantityInStock <= i.reorderLevel);
  });

  // Form modal (create / edit) — values in Naira, converted to kobo on submit
  showFormModal = signal(false);
  isEditing = signal(false);
  formSubmitting = signal(false);
  formError = signal('');
  formName = signal('');
  formQuantityInStock = signal(0);
  formReorderLevel = signal(0);
  formCostPriceNaira = signal<number | undefined>(undefined);
  formSellingPriceNaira = signal<number | undefined>(undefined);
  formSupplierId = signal<string | undefined>(undefined);
  formTrackStock = signal<boolean | null>(null);
  formBarcode = signal('');
  editId = signal('');

  // Restock modal
  showRestockModal = signal(false);
  selectedItem = signal<MenuItem | null>(null);
  restockQuantity = signal(0);
  restockCostPriceNaira = signal<number | undefined>(undefined);
  restockBarcode = signal('');

  ngOnInit() {
    this.loadInventory();
    this.suppliersApi.list().subscribe({ next: s => this.suppliers.set(s) });
  }

  loadInventory() {
    this.isLoading.set(true);
    const obs = this.lowStockOnly()
      ? this.inventoryApi.getAlerts()
      : this.inventoryApi.list();

    obs.subscribe({
      next: (data) => { this.inventory.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); Swal.fire({ icon: 'error', title: 'Failed to load inventory' }); }
    });
  }

  isLowStock(item: MenuItem): boolean {
    return item.quantityInStock <= item.reorderLevel;
  }

  // Create / Edit — values in Naira, converted to kobo for API
  openCreateModal() {
    this.formName.set('');
    this.formQuantityInStock.set(0);
    this.formReorderLevel.set(0);
    this.formCostPriceNaira.set(undefined);
    this.formSellingPriceNaira.set(undefined);
    this.formSupplierId.set(undefined);
    this.formTrackStock.set(null);
    this.formBarcode.set('');
    this.editId.set('');
    this.formError.set('');
    this.isEditing.set(false);
    this.showFormModal.set(true);
  }

  openEditModal(item: MenuItem) {
    this.editId.set(item.id);
    this.formName.set(item.name);
    this.formQuantityInStock.set(item.quantityInStock);
    this.formReorderLevel.set(item.reorderLevel);
    this.formCostPriceNaira.set(item.costPriceKobo != null ? item.costPriceKobo / 100 : undefined);
    this.formSellingPriceNaira.set(item.priceKobo != null ? item.priceKobo / 100 : undefined);
    this.formSupplierId.set(item.supplierId);
    this.formTrackStock.set(item.trackStock);
    this.formBarcode.set(item.barcode || '');
    this.formError.set('');
    this.isEditing.set(true);
    this.showFormModal.set(true);
  }

  closeFormModal() { this.showFormModal.set(false); this.formError.set(''); }

  private nairaToKobo(naira?: number): number | undefined {
    return naira != null ? Math.round(naira * 100) : undefined;
  }

  submitForm() {
    const name = this.formName().trim();
    if (!name) return;

    const trackStock = this.formTrackStock();
    if (trackStock === null) {
      this.formError.set('Choose whether this item is stock-tracked.');
      return;
    }
    if (trackStock && this.formQuantityInStock() < 0) {
      this.formError.set('Starting quantity must be 0 or more.');
      return;
    }

    this.formSubmitting.set(true);
    this.formError.set('');

    const done = () => this.formSubmitting.set(false);
    const onError = (err: HttpErrorResponse) => {
      done();
      if (err.status === 400 && err.error?.message) {
        this.formError.set(err.error.message);
      } else {
        Swal.fire({ icon: 'error', title: 'Operation Failed', text: 'Please try again.' });
      }
    };

    const payload: any = {
      name,
      trackStock,
      priceKobo: this.nairaToKobo(this.formSellingPriceNaira()),
      supplierId: this.formSupplierId() || null,
      barcode: this.formBarcode() || undefined,
    };

    if (trackStock) {
      payload.quantityInStock = this.formQuantityInStock();
      payload.reorderLevel = this.formReorderLevel();
      payload.costPriceKobo = this.nairaToKobo(this.formCostPriceNaira());
    }

    if (this.isEditing()) {
      this.inventoryApi.update(this.editId(), payload).subscribe({
        next: (updated) => { done(); this.inventory.update(is => is.map(i => i.id === updated.id ? updated : i)); this.closeFormModal(); },
        error: onError,
      });
    } else {
      this.inventoryApi.create(payload).subscribe({
        next: (created) => { done(); this.inventory.update(is => [...is, created]); this.closeFormModal(); },
        error: onError,
      });
    }
  }

  // Restock — values in Naira, converted to kobo for API
  openRestockModal(item: MenuItem) {
    this.selectedItem.set(item);
    this.restockQuantity.set(0);
    this.restockCostPriceNaira.set(undefined);
    this.restockBarcode.set('');
    this.showRestockModal.set(true);
  }

  closeRestockModal() {
    this.showRestockModal.set(false);
    this.selectedItem.set(null);
    this.restockQuantity.set(0);
    this.restockCostPriceNaira.set(undefined);
    this.restockBarcode.set('');
  }

  submitRestock() {
    if (!this.selectedItem() || this.restockQuantity() <= 0) {
      Swal.fire({ icon: 'error', title: 'Quantity must be greater than 0' });
      return;
    }
    const payload: RestockRequest = {
      added_quantity: this.restockQuantity(),
      cost_price_kobo: this.nairaToKobo(this.restockCostPriceNaira()),
      barcode: this.restockBarcode() || undefined,
    };
    this.inventoryApi.restock(this.selectedItem()!.id, payload).subscribe({
      next: (updated) => {
        Swal.fire({ icon: 'success', title: 'Stock Added', timer: 1500, showConfirmButton: false });
        this.inventory.update(is => is.map(i => i.id === updated.id ? updated : i));
        this.closeRestockModal();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to restock' })
    });
  }

  // Movements history
  viewMovements(item: MenuItem) {
    Swal.fire({
      title: 'Stock Movements',
      html: '<div style="max-height:300px;overflow-y:auto;"><p style="text-align:center;color:#94a3b8;">Loading...</p></div>',
      showConfirmButton: false,
      didOpen: () => {
        this.inventoryApi.getMovements(item.id).subscribe({
          next: (movements) => {
            const rows = (Array.isArray(movements) ? movements : []).map((m: any) => {
              const changeCls = m.quantityChange < 0 ? 'color:#ef4444' : 'color:#22c55e';
              const costStr = m.costAtPurchaseKobo != null ? `@ ${this.formatCurrency(m.costAtPurchaseKobo)}` : '';
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="${changeCls}">${m.quantityChange >= 0 ? '+' : ''}${m.quantityChange} &rarr; ${m.quantityAfter}</span>
                <span style="color:#94a3b8;">${(m.type || '').replace('_', ' ')}</span>
                <span style="color:#94a3b8;">${costStr}</span>
                <span style="color:#94a3b8;">${m.notes || ''}</span>
                <span style="color:#94a3b8;font-size:0.8rem;">${new Date(m.createdAt).toLocaleDateString()}</span>
              </div>`;
            }).join('');
            Swal.update({
              html: `<div style="max-height:300px;overflow-y:auto;">
                ${rows || '<p style="text-align:center;color:#94a3b8;">No movements recorded yet.</p>'}
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p><strong>Item:</strong> ${item.name}</p>
                  <p><strong>Current Stock:</strong> ${item.quantityInStock}</p>
                  <p><strong>Reorder Level:</strong> ${item.reorderLevel}</p>
                </div>
              </div>`,
              showConfirmButton: true, confirmButtonColor: '#F97316'
            });
          },
          error: () => Swal.update({ html: '<p style="text-align:center;color:#ef4444;">Failed to load movements.</p>', showConfirmButton: true, confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  deleteItem(item: MenuItem) {
    Swal.fire({
      title: 'Delete item?',
      text: `Remove "${item.name}" from inventory?`,
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
    }).then(r => {
      if (r.isConfirmed) {
        this.inventoryApi.removeById(item.id).subscribe({
          next: () => { this.inventory.update(is => is.filter(i => i.id !== item.id)); },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to delete' })
        });
      }
    });
  }

  getSupplierName(id?: string): string {
    if (!id) return '';
    const s = this.suppliers().find(s => s.id === id);
    return s ? s.name : '';
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '\u2014';
    return (amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Navigate to full-page views
  openAudit() { this.router.navigate(['/app/inventory/audit']); }
  openReconcile() { this.router.navigate(['/app/inventory/reconcile']); }
  openDailyTally() { this.router.navigate(['/app/inventory/daily-tally']); }

  // Untracked items
  toggleUntracked() {
    this.showUntracked.set(!this.showUntracked());
    if (this.showUntracked() && this.untrackedItems().length === 0) {
      this.loadUntrackedItems();
    }
  }

  loadUntrackedItems() {
    this.isLoadingUntracked.set(true);
    this.inventoryApi.getUntrackedItems().subscribe({
      next: (items) => { this.untrackedItems.set(items); this.isLoadingUntracked.set(false); },
      error: () => { this.isLoadingUntracked.set(false); Swal.fire({ icon: 'error', title: 'Failed to load untracked items' }); }
    });
  }

  startTracking(item: MenuItem) {
    Swal.fire({
      title: 'Enable Tracking?',
      text: `Start tracking stock for "${item.name}"? You'll need to set a starting quantity and reorder level.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enable Tracking',
    }).then(r => {
      if (!r.isConfirmed) return;
      Swal.fire({
        title: 'Set Starting Quantity',
        html: `
          <input id="swal-qty" class="swal2-input" type="number" min="0" placeholder="Quantity in stock" value="0">
          <input id="swal-reorder" class="swal2-input" type="number" min="0" placeholder="Reorder level" value="0">
        `,
        preConfirm: () => {
          const qty = parseInt((document.getElementById('swal-qty') as HTMLInputElement).value, 10);
          const reorder = parseInt((document.getElementById('swal-reorder') as HTMLInputElement).value, 10);
          if (isNaN(qty) || qty < 0 || isNaN(reorder) || reorder < 0) {
            Swal.showValidationMessage('Both values must be 0 or more');
            return false;
          }
          return { quantityInStock: qty, reorderLevel: reorder };
        },
        showCancelButton: true,
        confirmButtonText: 'Save',
      }).then(result => {
        if (!result.isConfirmed || !result.value) return;
        const { quantityInStock, reorderLevel } = result.value;
        this.inventoryApi.update(item.id, {
          trackStock: true,
          quantityInStock,
          reorderLevel,
          costPriceKobo: item.costPriceKobo,
        }).subscribe({
          next: (updated) => {
            Swal.fire({ icon: 'success', title: 'Tracking Enabled', timer: 1500, showConfirmButton: false });
            this.untrackedItems.update(items => items.filter(i => i.id !== item.id));
            this.inventory.update(items => items.map(i => i.id === updated.id ? updated : i));
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to update item' })
        });
      });
    });
  }

  trackById(_: number, item: MenuItem | any) { return item.id; }
}
