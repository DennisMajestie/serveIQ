import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, TablesApiService, MenuApiService, ENVIRONMENT_CONFIG, showApiErrorToast } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table, MenuItem, resolveImageUrl } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tab-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-detail.component.html',
  styleUrls: ['./tab-detail.component.scss']
})
export class TabDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tabService = inject(TabsApiService);
  private orderService = inject(OrdersApiService);
  private tableService = inject(TablesApiService);
  private menuService = inject(MenuApiService);
  private env = inject(ENVIRONMENT_CONFIG);

  tabId = signal('');
  tab = signal<Tab | null>(null);
  table = signal<Table | null>(null);
  items = signal<OrderItem[]>([]);
  menuItems = signal<MenuItem[]>([]);
  isLoading = signal(true);
  toastMessage = signal<string | null>(null);

  private orderPosted = false;

  subtotal = computed(() => {
    const items = this.items();
    return Array.isArray(items) ? items.reduce((sum, i) => sum + (i.priceKobo * i.quantity), 0) : 0;
  });
  vat = computed(() => Math.round(this.subtotal() * 0.075));
  total = computed(() => this.subtotal() + this.vat());

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.isLoading.set(true);
        this.loadTab(id);
        this.loadMenuItems();
      }
    });

    this.readRouterStateOnce();
  }

  private readRouterStateOnce() {
    if (this.orderPosted) return;
    
    const state = history.state as { selectedItems?: Array<{ id: string; name: string; qty: number; selectedPortionId?: string; portionName?: string; portionPrice?: number; price: number }> } | undefined;
    if (state?.selectedItems?.length) {
      this.orderPosted = true;
      this.addItemsFromMenu(state.selectedItems);
      history.replaceState({ ...history.state, selectedItems: undefined }, '');
    }
  }

  loadMenuItems() {
    this.menuService.getAllItems().subscribe({
      next: (items) => this.menuItems.set(items || []),
      error: () => {}
    });
  }

  getMenuItem(menuItemId: string): MenuItem | undefined {
    return this.menuItems().find(m => m.id === menuItemId);
  }

  getItemName(item: OrderItem): string {
    const directName = item.menuItemName || (item as any).menu_item_name || '';
    if (directName) return directName;

    const menuItemId = item.menuItemId ?? (item as any).menu_item_id ?? '';
    const menuItem = this.getMenuItem(menuItemId);
    return menuItem?.name ?? '';
  }

  getItemImage(item: OrderItem): string {
    const menuItemId = item.menuItemId ?? (item as any).menu_item_id ?? '';
    const menuItem = this.getMenuItem(menuItemId);
    return resolveImageUrl(menuItem?.imageUrl, this.env.apiUrl);
  }

  loadTab(id: string) {
    this.tabService.getTab(id).subscribe({
      next: (tab) => {
        this.tab.set(tab);
        this.loadOrders(id);
        if (tab.tableId) {
          this.tableService.getTable(tab.tableId).subscribe({
            next: (table) => this.table.set(table)
          });
        }
      },
      error: (err) => {
        const httpStatus = err.status ?? err.statusCode;
        if (httpStatus === 403) {
          const msg = err.message || 'This table is being served by another waiter';
          this.showToast(msg);
          setTimeout(() => this.router.navigate(['/tables']), 2500);
        } else {
          this.isLoading.set(false);
          Swal.fire({ icon: 'error', title: 'Failed to Load Tab', text: 'Could not load tab details.', background: '#1A1A1A', color: '#fff', confirmButtonColor: '#f97316' });
        }
      }
    });
  }

  loadOrders(tabId: string) {
    this.orderService.getByTab(tabId).subscribe({
      next: (items) => { 
        console.debug('loadOrders raw:', items);
        const raw = Array.isArray(items) ? items : [];
        const normalized = raw.map((item: any) => ({
          ...item,
          menuItemName: item.menuItemName || item.menu_item_name || item.menuItem?.name || item.menuItem?.menuItemName || item.menu_item?.name || item.menu_item?.menu_item_name || item.name || item.itemName || item.details?.name || 'Unknown Item',
          menuItemId: item.menuItemId ?? item.menu_item_id ?? '',
          priceKobo: item.priceKobo ?? item.price_kobo ?? item.unitPriceKobo ?? item.unit_price_kobo ?? 0,
          quantity: item.quantity ?? item.qty ?? 1
        }));
        console.debug('loadOrders normalized:', normalized);
        this.items.set(normalized); 
        this.isLoading.set(false); 
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load Orders', text: 'Could not load order items.', background: '#1A1A1A', color: '#fff', confirmButtonColor: '#f97316' });
      }
    });
  }

  viewItemDetail(item: OrderItem) {
    Swal.fire({
      title: this.getItemName(item),
      html: `
        <div style="text-align: left;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #888;">Quantity</span>
            <span style="font-weight: 600;">${item.quantity}x</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #888;">Unit Price</span>
            <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">₦${this.formatKobo(item.priceKobo)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #888;">Line Total</span>
            <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">₦${this.formatKobo(item.priceKobo * item.quantity)}</span>
          </div>
          ${item.notes ? `
          <div style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06);">
            <div style="color: #888; margin-bottom: 4px;">Notes</div>
            <div style="color: #fff;">${item.notes}</div>
          </div>` : ''}
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#f97316',
      background: '#1A1A1A',
      color: '#fff',
    });
  }

  removeItem(item: OrderItem) {
    Swal.fire({
      title: 'Remove item?',
      text: `Remove ${item.menuItemName} from the tab?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Remove'
    }).then(result => {
      if (result.isConfirmed) {
        this.orderService.deleteItem(item.id).subscribe(() =>
          this.items.update(is => is.filter(i => i.id !== item.id))
        );
      }
    });
  }

  addItem() {
    this.router.navigate(['/menu'], {
      queryParams: { tabId: this.tabId() }
    });
  }

  private addItemsFromMenu(selectedItems: Array<{ id: string; name: string; qty: number; selectedPortionId?: string; portionName?: string; portionPrice?: number; price: number }>) {
    const orderItems = selectedItems.map(item => ({
      menu_item_id: item.id,
      quantity: item.qty,
      notes: item.portionName ? `Portion: ${item.portionName}` : ''
    }));
    this.orderService.addItems(this.tabId(), orderItems).subscribe({
      next: (response) => {
        const normalized = (response || []).map((item: any) => ({
          ...item,
          menuItemName: item.menuItemName || item.menu_item_name || item.menuItem?.name || item.menuItem?.menuItemName || item.menu_item?.name || item.menu_item?.menu_item_name || 'Unknown Item',
          menuItemId: item.menuItemId ?? item.menu_item_id ?? '',
          priceKobo: item.priceKobo ?? item.price_kobo ?? item.unitPriceKobo ?? item.unit_price_kobo ?? 0,
          quantity: item.quantity ?? item.qty ?? 1
        }));
        this.items.update(current => [...current, ...normalized]);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} added to order`,
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('addItems error:', err);
        const names = selectedItems.map(i => i.name).filter(Boolean);
        const fallback = names.length ? `${names.join(', ')} out of stock, retocking in 5min` : 'Item unavailable';
        showApiErrorToast(err, fallback);
      }
    });
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 5000);
  }

  viewBill() {
    this.router.navigate(['/tabs/bill', this.tabId()]);
  }

  closeTab() {
    Swal.fire({
      title: 'Close Tab?',
      text: `Are you sure you want to close this tab? This will generate a bill.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      confirmButtonText: 'Close Tab'
    }).then(result => {
      if (result.isConfirmed) {
        this.tabService.closeTab(this.tabId()).subscribe({
          next: (_result: any) => {
            this.router.navigate(['/tabs/bill', this.tabId()]);
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to close tab'
            });
          }
        });
      }
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  padNumber(n: number | string | undefined | null, len: number = 2): string {
    return String(n ?? '').padStart(len, '0');
  }
}
