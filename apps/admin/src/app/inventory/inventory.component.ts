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

  // View stock movements (would need movements API - using placeholders for now)
  viewMovements(inventory: InventoryItem) {
    // In a real implementation, we would fetch movements via inventoryApi.getMovements(inventory.id)
    Swal.fire({
      title: 'Stock Movements',
      html: `<div style="max-height:300px;overflow-y:auto;">
        <p style="text-align:center;color:#94a3b8;">Stock movement tracking would go here</p>
        <div style="margin-top:16px;">
          <p><strong>Item:</strong> ${inventory.menuItemName || 'Unknown'}</p>
          <p><strong>Current Stock:</strong> ${inventory.quantityInStock}</p>
          <p><strong>Reorder Level:</strong> ${inventory.reorderLevel}</p>
          <p><strong>Low Stock:</strong> ${inventory.isLowStock ? 'Yes' : 'No'}</p>
        </div>
      </div>`,
      confirmButtonColor: '#F97316',
      width: 480
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