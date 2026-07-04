import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '@serveiq/shared/data-access';
import { InventoryItem, AddStockRequest, StockMovement } from '@serveiq/shared/models';
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

  inventory = signal<InventoryItem[]>([]);
  isLoading = signal(true);

  // Alerts/filter state
  lowStockOnly = signal(false);

  // Modals
  showAddStockModal = signal(false);
  selectedInventory = signal<InventoryItem | null>(null);

  // Stock form
  stockQuantity = signal<number>(0);
  stockNotes = signal('');

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.isLoading.set(true);
    const obs = this.lowStockOnly()
      ? this.inventoryApi.getAlerts()
      : this.inventoryApi.list();

    obs.subscribe({
      next: (data) => {
        this.inventory.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load inventory', confirmButtonColor: '#F97316' });
      }
    });
  }

  // Stock movement
  openStockModal(inventory: InventoryItem) {
    this.selectedInventory.set(inventory);
    this.stockQuantity.set(0);
    this.stockNotes.set('');
    this.showAddStockModal.set(true);
  }

  closeStockModal() {
    this.showAddStockModal.set(false);
    this.selectedInventory.set(null);
    this.stockQuantity.set(0);
    this.stockNotes.set('');
  }

  addStock() {
    if (!this.selectedInventory() || this.stockQuantity() <= 0) {
      Swal.fire({ icon: 'error', title: 'Stock quantity must be greater than 0', confirmButtonColor: '#F97316' });
      return;
    }

    const payload: AddStockRequest = {
      quantity: this.stockQuantity(),
      notes: this.stockNotes() || undefined
    };

    this.inventoryApi.addStock(this.selectedInventory()!.id, payload).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Stock Added', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
        this.closeStockModal();
        this.loadInventory();
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Failed to add stock', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  // View stock movements
  viewMovements(inventory: InventoryItem) {
    Swal.fire({
      title: 'Stock Movements',
      html: `<div style="max-height:300px;overflow-y:auto;">
        <p style="text-align:center;color:#94a3b8;">Loading movements...</p>
      </div>`,
      showConfirmButton: false,
      didOpen: () => {
        this.inventoryApi.getMovements(inventory.id).subscribe({
          next: (movements) => {
            const rows = (Array.isArray(movements) ? movements : []).map(m => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span>${m.previousStock} → ${m.newStock}</span>
                <span style="color:#94a3b8;">${m.notes || ''}</span>
                <span style="color:#94a3b8;font-size:0.8rem;">${new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
            `).join('');
            Swal.update({
              html: `<div style="max-height:300px;overflow-y:auto;">
                ${rows || '<p style="text-align:center;color:#94a3b8;">No movements recorded yet.</p>'}
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p><strong>Item:</strong> ${inventory.menuItemName || 'Unknown'}</p>
                  <p><strong>Current Stock:</strong> ${inventory.quantityInStock}</p>
                  <p><strong>Reorder Level:</strong> ${inventory.reorderLevel}</p>
                  <p><strong>Low Stock:</strong> ${inventory.isLowStock ? 'Yes' : 'No'}</p>
                </div>
              </div>`,
              showConfirmButton: true,
              confirmButtonColor: '#F97316'
            });
          },
          error: () => {
            Swal.update({
              html: `<div style="max-height:300px;overflow-y:auto;">
                <p style="text-align:center;color:#ef4444;">Failed to load movements.</p>
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p><strong>Item:</strong> ${inventory.menuItemName || 'Unknown'}</p>
                  <p><strong>Current Stock:</strong> ${inventory.quantityInStock}</p>
                  <p><strong>Reorder Level:</strong> ${inventory.reorderLevel}</p>
                </div>
              </div>`,
              showConfirmButton: true,
              confirmButtonColor: '#F97316'
            });
          }
        });
      }
    });
  }

  getStockStatusClass(isLowStock: boolean): string {
    return isLowStock ? 'alert-low-stock' : 'alert-normal';
  }

  getStockStatusText(isLowStock: boolean): string {
    return isLowStock ? 'Low Stock' : 'In Stock';
  }

  formatCurrency(amount: number): string {
    return (amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTotalValue(): number {
    return this.inventory().reduce((sum, item) => sum + item.quantityInStock, 0);
  }
}