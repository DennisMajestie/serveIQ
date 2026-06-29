import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, BillsApiService, MenuApiService, TablesApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table, MenuItem } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

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

  tabId = '';
  tab = signal<Tab | null>(null);
  orders = signal<OrderItem[]>([]);
  availableTables = signal<Table[]>([]);
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

  ngOnInit() {
    this.tabId = this.route.snapshot.paramMap.get('id') || '';
    this.loadTab();
    this.loadOrders();
    this.loadAvailableTables();
  }

  loadTab() {
    this.tabsApi.getTab(this.tabId).subscribe({
      next: (tab) => this.tab.set(tab),
      error: () => Swal.fire({ icon: 'error', title: 'Failed to load tab', confirmButtonColor: '#F97316' })
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
        Swal.fire({ icon: 'success', title: 'Items Added', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
        this.loadOrders();
      },
      error: () => {
        this.isAddingItems.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to add items', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
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
      Swal.fire({ icon: 'info', title: 'No tables available', confirmButtonColor: '#F97316' });
      return;
    }

    const doTransfer = (tableId: string) => {
      this.tabsApi.transferTab(this.tabId, tableId).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Tab Transferred', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
          this.loadTab();
          this.loadAvailableTables();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Transfer Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
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
      confirmButtonColor: '#F97316',
      background: '#1e293b',
      color: '#fff'
    }).then(result => {
      if (result.isConfirmed && result.value) {
        doTransfer(result.value);
      }
    });
  }

  updateOrderQuantity(item: OrderItem, quantity: number) {
    if (quantity <= 0) {
      this.removeOrderItem(item);
      return;
    }
    // Optimistic update for responsiveness
    this.orders.update(os => os.map(o => o.id === item.id ? { ...o, quantity } : o));
  }

  removeOrderItem(item: OrderItem) {
    Swal.fire({
      title: 'Remove item?',
      text: `Remove "${item.menuItemName}" from this tab?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      background: '#1e293b',
      color: '#fff'
    }).then(result => {
      if (result.isConfirmed) {
        this.orders.update(os => os.filter(o => o.id !== item.id));
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
    Swal.fire({
      title: 'Void Tab?',
      text: 'This will void the tab and release the table. Cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Void',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      background: '#1e293b',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        this.tabsApi.voidTab(this.tabId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Tab Voided', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
            this.router.navigate(['/tables']);
          },
          error: () => Swal.fire({ icon: 'error', title: 'Void Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  closeTab() {
    this.billsApi.generate(this.tabId).subscribe({
      next: (bill) => {
        Swal.fire({
          title: 'Bill Generated',
          html: `
            <div style="text-align:left;font-family:monospace;font-size:0.9rem">
              <p><strong>Subtotal:</strong> ₦${(bill.subtotalKobo / 100).toLocaleString()}</p>
              <p><strong>Service Charge:</strong> ${bill.serviceChargePercent}%</p>
              <p><strong>Total:</strong> ₦${(bill.totalKobo / 100).toLocaleString()}</p>
            </div>
          `,
          confirmButtonText: 'View Bill',
          confirmButtonColor: '#F97316',
          showCancelButton: true,
          cancelButtonText: 'Close'
        }).then(result => {
          if (result.isConfirmed) {
            this.router.navigate(['/bills']);
          }
        });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to Generate Bill', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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