import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { CustomerApiService } from '../services/customer-api.service';
import { showApiErrorToast } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
})
export class CartPageComponent {
  cartService = inject(CartService);
  private api = inject(CustomerApiService);
  private router = inject(Router);

  placing = false;
  placed = false;
  customerName = '';
  partySize = 1;
  showTypeModal = signal(false);
  selectedType = signal<'dine_in' | 'takeaway'>('dine_in');

  get totalKobo() {
    return this.cartService.items().reduce((sum, i) => sum + i.priceKobo * i.quantity, 0);
  }

  openTypeModal() {
    this.showTypeModal.set(true);
  }

  confirmType(type: 'dine_in' | 'takeaway') {
    this.showTypeModal.set(false);
    if (type === 'dine_in' && !this.cartService.tableId() && !this.cartService.tabId()) {
      showApiErrorToast({ message: 'No table selected. Please scan the QR code at your table.' }, 'Table not found');
      return;
    }
    this.placeOrder(type);
  }

  placeOrder(tabType?: 'dine_in' | 'takeaway') {
    if (this.placing || this.cartService.items().length === 0) return;

    const branchId = this.cartService.branchId();
    if (!branchId) {
      showApiErrorToast({ message: 'No branch selected' }, 'Session expired. Please reload the menu.');
      return;
    }

    const effectiveType = tabType || 'dine_in';
    this.placing = true;
    const existingTabId = this.cartService.tabId();
    const existingCode = this.cartService.trackingCode();

    const doPlaceOrders = (tabId: string, trackingCode: string) => {
      const items = this.cartService.items().map(i => ({
        menu_item_id: i.menuItemId,
        quantity: i.quantity,
        notes: i.notes || undefined,
      }));

      this.api.placeOrder(tabId, trackingCode, items).subscribe({
        next: () => {
          this.placed = true;
          this.cartService.clearCart();
          this.router.navigate(['/public/status']);
        },
        error: (err) => {
          showApiErrorToast(err, 'Failed to place order');
          this.placing = false;
        },
      });
    };

    if (existingTabId && existingCode) {
      doPlaceOrders(existingTabId, existingCode);
    } else {
      const tableId = effectiveType === 'dine_in' ? (this.cartService.tableId() || undefined) : undefined;
      this.api.openTab(branchId, tableId, this.customerName || undefined, this.partySize, effectiveType).subscribe({
        next: (tab) => {
          this.cartService.setSession(tab.id, tab.trackingCode, branchId);
          doPlaceOrders(tab.id, tab.trackingCode);
        },
        error: (err) => {
          const msg = err?.serverMessage || err?.message || '';
          if (msg.toLowerCase().includes('no counter') || msg.toLowerCase().includes('no virtual') || msg.toLowerCase().includes('takeaway')) {
            showApiErrorToast(err, 'This branch has no counter set up for takeaway. Please ask staff for help.');
          } else {
            showApiErrorToast(err, 'Failed to open tab');
          }
          this.placing = false;
        },
      });
    }
  }
}