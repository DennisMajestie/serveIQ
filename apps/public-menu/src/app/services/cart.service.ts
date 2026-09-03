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
  orderType: 'serveiq_order_type',
  cartItems: 'serveiq_cart_items',
};

export type OrderType = 'dine_in' | 'takeaway';

const ORDER_TYPES: OrderType[] = ['dine_in', 'takeaway'];

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.loadCart());
  readonly tabId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.tabId));
  readonly trackingCode = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.trackingCode));
  readonly branchId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.branchId));
  readonly tableId = signal<string | null>(sessionStorage.getItem(STORAGE_KEYS.tableId));
  readonly orderType = signal<OrderType | null>(this.loadOrderType());

  /** Business-level pricing settings used for the pre-order review totals. */
  readonly taxRate = signal<number>(7.5);
  readonly serviceChargePercent = signal<number>(10);

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
    if (!this.orderType()) {
      this.setOrderType('dine_in');
    }
  }

  /** Drop the session's tab (e.g. it was closed/paid) but keep the cart,
   *  branch and surface selections so a fresh tab can be opened. */
  clearTabSession() {
    this.tabId.set(null);
    this.trackingCode.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.tabId);
    sessionStorage.removeItem(STORAGE_KEYS.trackingCode);
  }

  setOrderType(type: OrderType) {
    this.orderType.set(type);
    sessionStorage.setItem(STORAGE_KEYS.orderType, type);
  }

  setPricingSettings(taxRate: number, serviceChargePercent: number) {
    this.taxRate.set(Number.isFinite(taxRate) ? taxRate : 7.5);
    this.serviceChargePercent.set(
      Number.isFinite(serviceChargePercent) ? serviceChargePercent : 10,
    );
  }

  clearSession() {
    this.tabId.set(null);
    this.trackingCode.set(null);
    this.branchId.set(null);
    this.tableId.set(null);
    this.orderType.set(null);
    sessionStorage.removeItem(STORAGE_KEYS.tabId);
    sessionStorage.removeItem(STORAGE_KEYS.trackingCode);
    sessionStorage.removeItem(STORAGE_KEYS.branchId);
    sessionStorage.removeItem(STORAGE_KEYS.tableId);
    sessionStorage.removeItem(STORAGE_KEYS.orderType);
    this.clearCart();
  }

  private loadOrderType(): OrderType | null {
    const raw = sessionStorage.getItem(STORAGE_KEYS.orderType);
    return ORDER_TYPES.includes(raw as OrderType) ? (raw as OrderType) : null;
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