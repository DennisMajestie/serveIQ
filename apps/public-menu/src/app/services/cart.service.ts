import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  menuItemId: string;
  name: string;
  priceKobo: number;
  quantity: number;
  notes?: string;
}

const STORAGE_KEYS = {
  tabId: 'serveiq_tab_id',
  trackingCode: 'serveiq_tracking_code',
  branchId: 'serveiq_branch_id',
  tableId: 'serveiq_table_id',
  cartItems: 'serveiq_cart_items',
};

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.loadCart());
  readonly tabId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.tabId));
  readonly trackingCode = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.trackingCode));
  readonly branchId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.branchId));
  readonly tableId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.tableId));

  readonly itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly totalKobo = computed(() => this.items().reduce((sum, i) => sum + i.priceKobo * i.quantity, 0));

  readonly hasTable = computed(() => !!this.tableId());

  addItem(menuItemId: string, name: string, priceKobo: number, notes?: string) {
    const current = this.items();
    const existing = current.find(i => i.menuItemId === menuItemId && i.notes === notes);
    if (existing) {
      existing.quantity += 1;
      this.items.set([...current]);
    } else {
      this.items.set([...current, { menuItemId, name, priceKobo, quantity: 1, notes }]);
    }
    this.saveCart();
  }

  removeItem(menuItemId: string) {
    this.items.set(this.items().filter(i => i.menuItemId !== menuItemId));
    this.saveCart();
  }

  updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
      return;
    }
    const current = this.items();
    const item = current.find(i => i.menuItemId === menuItemId);
    if (item) {
      item.quantity = quantity;
      this.items.set([...current]);
      this.saveCart();
    }
  }

  clearCart() {
    this.items.set([]);
    this.saveCart();
  }

  setSession(tabId: string, trackingCode: string, branchId: string) {
    this.tabId.set(tabId);
    this.trackingCode.set(trackingCode);
    this.branchId.set(branchId);
    sessionStorage.setItem(STORAGE_KEYS.tabId, tabId);
    sessionStorage.setItem(STORAGE_KEYS.trackingCode, trackingCode);
    sessionStorage.setItem(STORAGE_KEYS.branchId, branchId);
  }

  setTableId(tableId: string) {
    this.tableId.set(tableId);
    sessionStorage.setItem(STORAGE_KEYS.tableId, tableId);
  }

  clearSession() {
    this.tabId.set(null);
    this.trackingCode.set(null);
    this.branchId.set(null);
    this.tableId.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.tabId);
    sessionStorage.removeItem(STORAGE_KEYS.trackingCode);
    sessionStorage.removeItem(STORAGE_KEYS.branchId);
    sessionStorage.removeItem(STORAGE_KEYS.tableId);
    this.clearCart();
  }

  private loadCart(): CartItem[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.cartItems);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveCart() {
    sessionStorage.setItem(STORAGE_KEYS.cartItems, JSON.stringify(this.items()));
  }
}