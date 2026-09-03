import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { CustomerApiService } from '../services/customer-api.service';
import { CallWaiterComponent } from '../call-waiter/call-waiter.component';
import { showApiErrorToast } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CallWaiterComponent],
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
  showConfirmModal = signal(false);
  selectedType = signal<'dine_in' | 'takeaway'>(this.cartService.orderType() ?? 'dine_in');

  get subtotalKobo() {
    return this.cartService.items().reduce((sum, i) => sum + i.priceKobo * i.quantity, 0);
  }

  get vatKobo() {
    return Math.round(this.subtotalKobo * this.cartService.taxRate() / 100);
  }

  get serviceChargeKobo() {
    return Math.round(this.subtotalKobo * this.cartService.serviceChargePercent() / 100);
  }

  get totalKobo() {
    return this.subtotalKobo + this.vatKobo + this.serviceChargeKobo;
  }

  get taxRate() {
    return this.cartService.taxRate();
  }

  get serviceChargePercent() {
    return this.cartService.serviceChargePercent();
  }

  openTypeModal() {
    this.showTypeModal.set(true);
  }

  onPlaceOrder() {
    if (this.cartService.orderType()) {
      this.showConfirmModal.set(true);
    } else {
      this.showTypeModal.set(true);
    }
  }

  confirmType(type: 'dine_in' | 'takeaway') {
    this.showTypeModal.set(false);
    this.cartService.setOrderType(type);
    if (type === 'dine_in' && !this.cartService.tableId() && !this.cartService.tabId()) {
      showApiErrorToast({ message: 'No table selected. Please scan the QR code at your table.' }, 'Table not found');
      return;
    }
    this.showConfirmModal.set(true);
  }

  confirmPlaceOrder() {
    this.showConfirmModal.set(false);
    this.placeOrder();
  }

  placeOrder(tabType?: 'dine_in' | 'takeaway') {
    if (this.placing || this.cartService.items().length === 0) return;

    const branchId = this.cartService.branchId();
    if (!branchId) {
      showApiErrorToast({ message: 'No branch selected' }, 'Session expired. Please reload the menu.');
      return;
    }

    const effectiveType = tabType || this.cartService.orderType() || 'dine_in';
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
      // Verify the stored tab is still open before reusing it. sessionStorage
      // keeps the tab across page visits, so a paid/closed tab from an earlier
      // order would otherwise be reused and fail with "Tab is not open".
      this.api.getTabStatus(existingTabId, existingCode).subscribe({
        next: (tab) => {
          if (tab?.status === 'open') {
            doPlaceOrders(existingTabId, existingCode);
          } else {
            this.cartService.clearTabSession();
            this.openFreshTab(effectiveType, branchId, doPlaceOrders);
          }
        },
        error: () => {
          this.cartService.clearTabSession();
          this.openFreshTab(effectiveType, branchId, doPlaceOrders);
        },
      });
    } else {
      this.openFreshTab(effectiveType, branchId, doPlaceOrders);
    }
  }

  private openFreshTab(
    effectiveType: 'dine_in' | 'takeaway',
    branchId: string,
    doPlaceOrders: (tabId: string, trackingCode: string) => void,
  ) {
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