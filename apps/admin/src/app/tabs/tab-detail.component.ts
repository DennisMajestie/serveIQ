import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, BillsApiService, MenuApiService, TablesApiService, showApiErrorToast } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table, MenuItem, ApplyDiscountRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../core/currency-context.service';

@Component({
  selector: 'app-tab-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-detail.component.html',
  styleUrls: ['./tab-detail.component.scss']
})
export class TabDetailComponent implements OnInit {
  private tabsApi = inject(TabsApiService);
  private ordersApi = inject(OrdersApiService);
  private billsApi = inject(BillsApiService);
  private menuApi = inject(MenuApiService);
  private tablesApi = inject(TablesApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private currency = inject(CurrencyContextService);

  tabId = '';
  tab = signal<Tab | null>(null);
  orders = signal<OrderItem[]>([]);
  availableTables = signal<Table[]>([]);
  openTabs = signal<any[]>([]);
  isLoading = signal(true);
  isAddingItems = signal(false);
  showAddItemsModal = signal(false);
  selectedMenuItems = signal<{ menuItem: MenuItem; quantity: number; notes?: string }[]>([]);
  searchQuery = signal('');
  selectedCategory = signal('All');
  selectedCategoryItems = computed(() => {
    if (this.selectedCategory() === 'All') return this.menuItems();
    return this.menuItems().filter(item => item.category === this.selectedCategory());
  });

  menuItems = signal<MenuItem[]>([]);
  categories = signal<string[]>(['All']);
  isLoadingMenu = signal(false);

  // Discount
  discountKobo = signal(0);
  discountReason = signal('');
  showDiscountInput = signal(false);

  ngOnInit() {
    this.tabId = this.route.snapshot.paramMap.get('id') || '';
    this.loadTab();
    this.loadOrders();
    this.loadAvailableTables();
    this.loadOpenTabs();
  }

  loadTab() {
    this.tabsApi.getTab(this.tabId).subscribe({
      next: (tab) => this.tab.set(tab),
      error: () => Swal.fire({ icon: 'error', title: 'Failed to load tab' })
    });
  }

  loadOrders() {
    this.ordersApi.getByTab(this.tabId).subscribe({
      next: (orders) => this.orders.set(orders || []),
      error: () => this.orders.set([])
    });
  }

  loadAvailableTables() {
    this.tablesApi.getAllTables().subscribe({
      next: (tables) => {
        this.availableTables.set(tables.filter(t => t.status === 'available'));
      },
      error: () => this.availableTables.set([])
    });
  }

  loadOpenTabs() {
    this.tabsApi.getAllTabs({ status: 'open' }).subscribe({
      next: (tabs) => this.openTabs.set(tabs.filter(t => t.id !== this.tabId && t.status === 'open')),
      error: () => this.openTabs.set([])
    });
  }

  // ===== Order Management =====

  openAddItemsModal() {
    this.showAddItemsModal.set(true);
    this.loadMenuItems();
  }

  closeAddItemsModal() {
    this.showAddItemsModal.set(false);
    this.selectedMenuItems.set([]);
  }

  loadMenuItems() {
    this.isLoadingMenu.set(true);
    this.menuApi.getAllItems().subscribe({
      next: (items) => {
        this.menuItems.set(items);
        const cats = ['All', ...new Set(items.map(i => i.category))];
        this.categories.set(cats);
        this.isLoadingMenu.set(false);
      },
      error: () => this.isLoadingMenu.set(false)
    });
  }

  addItemToSelection(item: MenuItem) {
    const existing = this.selectedMenuItems().find(s => s.menuItem.id === item.id);
    if (existing) {
      this.selectedMenuItems.update(items => items.map(s => s.menuItem.id === item.id ? { ...s, quantity: s.quantity + 1 } : s));
    } else {
      this.selectedMenuItems.update(items => [...items, { menuItem: item, quantity: 1, notes: '' }]);
    }
  }

  removeItemFromSelection(index: number) {
    this.selectedMenuItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItemQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItemFromSelection(index);
      return;
    }
    this.selectedMenuItems.update(items => items.map((s, i) => i === index ? { ...s, quantity } : s));
  }

  confirmAddItems() {
    if (this.selectedMenuItems().length === 0) return;

    this.isAddingItems.set(true);
    const orderItems = this.selectedMenuItems().map(s => ({
      menu_item_id: s.menuItem.id,
      quantity: s.quantity,
      notes: s.notes || ''
    }));

    this.ordersApi.addItems(this.tabId, orderItems).subscribe({
      next: () => {
        this.isAddingItems.set(false);
        this.closeAddItemsModal();
        Swal.fire({ icon: 'success', title: 'Items Added', timer: 1500, showConfirmButton: false });
        this.loadOrders();
      },
      error: (err) => {
        this.isAddingItems.set(false);
        showApiErrorToast(err, 'Failed to add items');
      }
    });
  }

  // ===== Tab Actions =====

  goBack() {
    this.location.back();
  }

  transferTab(targetTableId?: string) {
    const tables = this.availableTables();
    if (tables.length === 0) {
      Swal.fire({ icon: 'info', title: 'No tables available' });
      return;
    }

    const doTransfer = (tableId: string) => {
      this.tabsApi.transferTab(this.tabId, tableId).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Tab Transferred', timer: 1500, showConfirmButton: false });
          this.loadTab();
          this.loadAvailableTables();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Transfer Failed' })
      });
    };

    if (targetTableId) {
      doTransfer(targetTableId);
      return;
    }

    const inputOptions = tables.reduce((acc, t) => ({ ...acc, [t.id]: t.label || t.tableNumber || `Table ${t.id.slice(0, 6)}` }), {} as Record<string, string>);
    Swal.fire({
      title: 'Transfer to Table',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Select a table',
      showCancelButton: true,
    }).then(result => {
      if (result.isConfirmed && result.value) {
        doTransfer(result.value);
      }
    });
  }

  mergeTab() {
    const tabs = this.openTabs();
    if (tabs.length === 0) {
      Swal.fire({ icon: 'info', title: 'No other open tabs to merge into' });
      return;
    }

    const inputOptions = tabs.reduce((acc, t) => {
      const tableLabel = t.table?.tableNumber || t.table?.table_number || t.tableId || 'Unknown table';
      const waiterLabel = t.waiter?.fullName || t.waiter?.full_name || '';
      const label = `Table ${tableLabel}${waiterLabel ? ' — ' + waiterLabel : ''}`;
      return { ...acc, [t.id]: label };
    }, {} as Record<string, string>);

    Swal.fire({
      title: 'Merge Into Tab',
      text: 'All orders from this tab will move onto the selected tab, and this table will be released.',
      icon: 'warning',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Select a target tab',
      showCancelButton: true,
      confirmButtonText: 'Merge',
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.tabsApi.mergeTab(this.tabId, result.value).subscribe({
          next: (mergedTab) => {
            const target: any = mergedTab;
            const targetLabel = target?.table?.tableNumber || target?.table?.table_number || 'target';
            Swal.fire({
              icon: 'success',
              title: 'Tabs Merged',
              html: `Orders moved to <strong>Table ${targetLabel}</strong>. This table was released.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.router.navigate(['/app/tabs']);
          },
          error: (err) => showApiErrorToast(err, 'Merge Failed')
        });
      }
    });
  }

  updateOrderQuantity(item: OrderItem, quantity: number) {
    if (quantity <= 0) {
      this.removeOrderItem(item);
      return;
    }
    this.ordersApi.updateItem(item.id, { quantity }).subscribe({
      next: (updated) => this.orders.update(os => os.map(o => o.id === item.id ? updated : o)),
      error: () => Swal.fire({ icon: 'error', title: 'Update Failed' })
    });
  }

  removeOrderItem(item: OrderItem) {
    Swal.fire({
      title: 'Remove item?',
      text: `Remove "${item.menuItemName}" from this tab?`,
      icon: 'warning',
      showCancelButton: true,
    }).then(result => {
      if (result.isConfirmed) {
        this.ordersApi.deleteItem(item.id).subscribe({
          next: () => this.orders.update(os => os.filter(o => o.id !== item.id)),
          error: () => Swal.fire({ icon: 'error', title: 'Remove Failed', text: 'Could not remove item. Please try again.' })
        });
      }
    });
  }

  printBill() {
    this.router.navigate(['/bills']);
  }

  trackById(_index: number, item: { id: string }) {
    return item.id;
  }

  voidTab() {
    const orderCount = this.orders().length;
    const itemsText = orderCount > 0
      ? `This will void the tab, release the table, and restore stock for ${orderCount} ordered item${orderCount > 1 ? 's' : ''}. Cannot be undone.`
      : 'This will void the tab and release the table. Cannot be undone.';

    Swal.fire({
      title: 'Void Tab?',
      text: itemsText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Void',
    }).then((result) => {
      if (result.isConfirmed) {
        this.tabsApi.voidTab(this.tabId).subscribe({
          next: () => {
            const successText = orderCount > 0
              ? `Tab Voided — stock restored for ${orderCount} item${orderCount > 1 ? 's' : ''}`
              : 'Tab Voided';
            Swal.fire({ icon: 'success', title: successText, timer: 2000, showConfirmButton: false });
            this.router.navigate(['/tables']);
          },
          error: () => Swal.fire({ icon: 'error', title: 'Void Failed' })
        });
      }
    });
  }

  applyDiscountToTab() {
    if (this.discountKobo() <= 0) return;
    const payload: ApplyDiscountRequest = {
      discountKobo: this.discountKobo(),
      reason: this.discountReason() || undefined,
    };
    this.billsApi.applyDiscount(this.tabId, payload).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Discount Applied', timer: 1500, showConfirmButton: false });
        this.showDiscountInput.set(false);
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to apply discount' }),
    });
  }

  closeTab() {
    Swal.fire({
      title: 'Generate Bill',
      html: `
        <div style="text-align:left;font-size:0.9rem">
          <p><strong>Subtotal:</strong> ${this.formatKobo(this.getSubtotal())}</p>
          <p><strong>VAT (7.5%):</strong> ${this.formatKobo(this.getVat())}</p>
          <p><strong>Total:</strong> ${this.formatKobo(this.getGrandTotal())}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generate Bill & Close',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.billsApi.generate(this.tabId, { discountKobo: this.discountKobo() || undefined }).subscribe({
        next: (bill) => {
          this.tabsApi.closeTab(this.tabId).subscribe({
            next: () => {
              Swal.fire({
                title: 'Tab Closed',
                html: `
                  <div style="text-align:left;font-family:monospace;font-size:0.9rem">
                    <p><strong>Subtotal:</strong> ${this.formatKobo(bill.subtotalKobo)}</p>
                    <p><strong>Service Charge:</strong> ${bill.serviceChargePercent}%</p>
                    <p><strong>Discount:</strong> ${this.formatKobo(bill.discountKobo)}</p>
                    <p><strong>Total:</strong> ${this.formatKobo(bill.totalKobo)}</p>
                  </div>
                `,
                confirmButtonText: 'View Bills',
                showCancelButton: true,
                cancelButtonText: 'Close'
              }).then(r => {
                if (r.isConfirmed) this.router.navigate(['/app/bills']);
              });
            },
            error: () => Swal.fire({ icon: 'error', title: 'Failed to Close Tab' })
          });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Failed to Generate Bill' })
      });
    });
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  getSubtotal(): number {
    return this.orders().reduce((sum, item) => {
      const price = item.priceKobo || item.price_kobo || item.unit_price_kobo || 0;
      return sum + (price * (item.quantity || item.qty || 1));
    }, 0);
  }

  getVat(): number {
    return this.getSubtotal() * 0.075;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getVat();
  }

  getGrandTotal(): number {
    return this.getTotal();
  }
}