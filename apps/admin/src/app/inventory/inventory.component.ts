import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventoryApiService, SuppliersApiService } from '@serveiq/shared/data-access';
import { Ingredient, IngredientUnit, AddStockRequest, CreateIngredientRequest, UpdateIngredientRequest, Supplier } from '@serveiq/shared/models';
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

  IngredientUnit = IngredientUnit;
  unitOptions = Object.values(IngredientUnit);
  discreteUnits = new Set([IngredientUnit.PACK, IngredientUnit.CRATE]);

  inventory = signal<Ingredient[]>([]);
  suppliers = signal<Supplier[]>([]);
  isLoading = signal(true);
  lowStockOnly = signal(false);

  filteredInventory = computed(() => {
    const items = this.inventory();
    if (!this.lowStockOnly()) return items;
    return items.filter(i => i.quantityInStock <= i.reorderLevel);
  });

  // Form modal
  showFormModal = signal(false);
  isEditing = signal(false);
  formSubmitting = signal(false);
  formError = signal('');
  formName = signal('');
  formUnit = signal<IngredientUnit>(IngredientUnit.KG);
  formQuantity = signal(0);
  formReorderLevel = signal(0);
  formConversionToBase = signal<number | undefined>(undefined);
  formBaseUnit = signal<IngredientUnit | undefined>(undefined);
  formCostPerUnit = signal<number | undefined>(undefined);
  formMenuItemId = signal<string | undefined>(undefined);
  formSupplierId = signal<string | undefined>(undefined);
  editId = signal('');

  // Stock modal
  showAddStockModal = signal(false);
  selectedIngredient = signal<Ingredient | null>(null);
  stockQuantity = signal(0);
  stockNotes = signal('');

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

  isLowStock(item: Ingredient): boolean {
    return item.quantityInStock <= item.reorderLevel;
  }

  getLinkBadge(item: Ingredient): { text: string; cssClass: string } | null {
    return item.menuItemId
      ? { text: 'Direct-linked', cssClass: 'badge-direct' }
      : { text: 'Used in recipes', cssClass: 'badge-recipe' };
  }

  quantityClass(item: Ingredient): string {
    return item.quantityInStock < 0 ? 'stat-value stat-negative' : 'stat-value';
  }

  // Create / Edit
  openCreateModal() {
    this.formName.set(''); this.formUnit.set(IngredientUnit.KG);
    this.formQuantity.set(0); this.formReorderLevel.set(0);
    this.formConversionToBase.set(undefined); this.formBaseUnit.set(undefined);
    this.formCostPerUnit.set(undefined); this.formMenuItemId.set(undefined);
    this.formSupplierId.set(undefined); this.editId.set('');
    this.formError.set(''); this.isEditing.set(false); this.showFormModal.set(true);
  }

  openEditModal(item: Ingredient) {
    this.editId.set(item.id); this.formName.set(item.name);
    this.formUnit.set(item.unit); this.formQuantity.set(item.quantityInStock);
    this.formReorderLevel.set(item.reorderLevel);
    this.formConversionToBase.set(item.conversionToBase);
    this.formBaseUnit.set(item.baseUnit); this.formCostPerUnit.set(item.costPerUnit);
    this.formMenuItemId.set(item.menuItemId); this.formSupplierId.set(item.supplierId);
    this.formError.set(''); this.isEditing.set(true); this.showFormModal.set(true);
  }

  closeFormModal() { this.showFormModal.set(false); this.formError.set(''); }

  submitForm() {
    const name = this.formName().trim();
    if (!name) return;
    this.formSubmitting.set(true); this.formError.set('');

    const done = () => this.formSubmitting.set(false);
    const onError = (err: HttpErrorResponse) => {
      done();
      if (err.status === 400 && err.error?.message) {
        this.formError.set(err.error.message);
      } else {
        Swal.fire({ icon: 'error', title: 'Operation Failed', text: 'Please try again.' });
      }
    };

    if (this.isEditing()) {
      const payload: UpdateIngredientRequest = {
        name, unit: this.formUnit(),
        quantityInStock: this.formQuantity(), reorderLevel: this.formReorderLevel(),
        conversionToBase: this.formConversionToBase(), baseUnit: this.formBaseUnit(),
        costPerUnit: this.formCostPerUnit(), menuItemId: this.formMenuItemId(),
        supplierId: this.formSupplierId() ?? null,
      };
      this.inventoryApi.update(this.editId(), payload).subscribe({
        next: (updated) => { done(); this.inventory.update(is => is.map(i => i.id === updated.id ? updated : i)); this.closeFormModal(); },
        error: onError,
      });
    } else {
      const payload: CreateIngredientRequest = {
        name, unit: this.formUnit(),
        quantityInStock: this.formQuantity(), reorderLevel: this.formReorderLevel(),
        conversionToBase: this.formConversionToBase(), baseUnit: this.formBaseUnit(),
        costPerUnit: this.formCostPerUnit(), menuItemId: this.formMenuItemId(),
        supplierId: this.formSupplierId(),
      };
      this.inventoryApi.create(payload).subscribe({
        next: (created) => { done(); this.inventory.update(is => [...is, created]); this.closeFormModal(); },
        error: onError,
      });
    }
  }

  onUnitChange(unit: IngredientUnit) {
    this.formUnit.set(unit);
    if (!this.discreteUnits.has(unit)) {
      this.formConversionToBase.set(undefined);
      this.formBaseUnit.set(undefined);
    }
  }

  // Stock movement
  openStockModal(ingredient: Ingredient) {
    this.selectedIngredient.set(ingredient);
    this.stockQuantity.set(0); this.stockNotes.set('');
    this.showAddStockModal.set(true);
  }

  closeStockModal() {
    this.showAddStockModal.set(false);
    this.selectedIngredient.set(null);
    this.stockQuantity.set(0); this.stockNotes.set('');
  }

  addStock() {
    if (!this.selectedIngredient() || this.stockQuantity() <= 0) {
      Swal.fire({ icon: 'error', title: 'Stock quantity must be greater than 0' });
      return;
    }
    const payload: AddStockRequest = { quantity: this.stockQuantity(), notes: this.stockNotes() || undefined };
    this.inventoryApi.addStock(this.selectedIngredient()!.id, payload).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Stock Added', timer: 1500, showConfirmButton: false });
        this.closeStockModal();
        this.loadInventory();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to add stock' })
    });
  }

  viewMovements(ingredient: Ingredient) {
    const qtyStyle = ingredient.quantityInStock < 0 ? 'color:#ef4444;font-weight:700' : '';
    Swal.fire({
      title: 'Stock Movements',
      html: '<div style="max-height:300px;overflow-y:auto;"><p style="text-align:center;color:#94a3b8;">Loading...</p></div>',
      showConfirmButton: false,
      didOpen: () => {
        this.inventoryApi.getMovements(ingredient.id).subscribe({
          next: (movements) => {
            const rows = (Array.isArray(movements) ? movements : []).map(m => {
              const changeCls = m.quantityChange < 0 ? 'color:#ef4444' : 'color:#22c55e';
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="${changeCls}">${m.quantityChange >= 0 ? '+' : ''}${m.quantityChange} \u2192 ${m.quantityAfter}</span>
                <span style="color:#94a3b8;">${m.type.replace('_', ' ')}</span>
                <span style="color:#94a3b8;">${m.notes || ''}</span>
                <span style="color:#94a3b8;font-size:0.8rem;">${new Date(m.createdAt).toLocaleDateString()}</span>
              </div>`;
            }).join('');
            Swal.update({
              html: `<div style="max-height:300px;overflow-y:auto;">
                ${rows || '<p style="text-align:center;color:#94a3b8;">No movements recorded yet.</p>'}
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p><strong>Item:</strong> ${ingredient.name}</p>
                  <p><strong>Current Stock:</strong> <span style="${qtyStyle}">${ingredient.quantityInStock}</span> ${ingredient.unit}</p>
                  <p><strong>Reorder Level:</strong> ${ingredient.reorderLevel}</p>
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

  deleteIngredient(item: Ingredient) {
    Swal.fire({
      title: 'Delete ingredient?',
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

  trackById(_: number, item: Ingredient) { return item.id; }
}
