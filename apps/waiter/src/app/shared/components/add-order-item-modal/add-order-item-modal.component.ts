import { Component, signal, computed, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuApiService } from '@serveiq/shared/data-access';
import { MenuItem } from '@serveiq/shared/models';

@Component({
  selector: 'app-add-order-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-order-item-modal.component.html',
  styleUrls: ['./add-order-item-modal.component.scss']
})
export class AddOrderItemModalComponent implements OnInit {
  private menuService = inject(MenuApiService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<{ menuItemId: string; quantity: number; notes: string }>();

  menuItems = signal<MenuItem[]>([]);
  selectedItemId = signal<string | null>(null);
  quantity = signal(1);
  notes = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    if (this.isOpen) {
      this.loadMenuItems();
    }
  }

  loadMenuItems() {
    this.isLoading.set(true);
    this.error.set(null);
    this.menuService.getAllItems().subscribe({
      next: (items) => {
        this.menuItems.set(Array.isArray(items) ? items.filter(i => i.isAvailable) : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load menu items');
        this.isLoading.set(false);
      }
    });
  }

  selectItem(itemId: string) {
    if (this.selectedItemId() === itemId) {
      this.selectedItemId.set(null);
      this.quantity.set(1);
    } else {
      this.selectedItemId.set(itemId);
      this.quantity.set(1);
    }
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  onConfirm() {
    const itemId = this.selectedItemId();
    if (!itemId) return;

    this.addItem.emit({
      menuItemId: itemId,
      quantity: this.quantity(),
      notes: this.notes().trim()
    });
    this.resetForm();
    this.close.emit();
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  private resetForm() {
    this.selectedItemId.set(null);
    this.quantity.set(1);
    this.notes.set('');
  }

  formatPrice(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  getSelectedItem(): MenuItem | undefined {
    return this.menuItems().find(i => i.id === this.selectedItemId());
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItemId() === itemId;
  }
}