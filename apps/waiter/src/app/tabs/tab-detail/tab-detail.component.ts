import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, TablesApiService, MenuApiService, ENVIRONMENT_CONFIG, showApiErrorToast, NotificationsApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table, MenuItem, resolveImageUrl, OrderGroup, NotificationType } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-tab-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-detail.component.html',
  styleUrls: ['./tab-detail.component.scss']
})
export class TabDetailComponent implements OnInit, OnDestroy {
  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tabService = inject(TabsApiService);
  private orderService = inject(OrdersApiService);
  private tableService = inject(TablesApiService);
  private menuService = inject(MenuApiService);
  private env = inject(ENVIRONMENT_CONFIG);
  private notificationsApi = inject(NotificationsApiService);

  tabId = signal('');
  tab = signal<Tab | null>(null);
  table = signal<Table | null>(null);
  items = signal<OrderItem[]>([]);
  menuItems = signal<MenuItem[]>([]);
  isLoading = signal(true);
  toastMessage = signal<string | null>(null);

  activeOrder = signal<OrderGroup | null>(null);
  orderStatus = computed(() => {
    const item = this.activeOrder()?.items?.[0] as any;
    return item?.orderStatus || item?.order_status || null;
  });
  declineReason = computed(() => this.activeOrder()?.items[0]?.declineReason ?? null);
  timerEndsAt = computed(() => this.activeOrder()?.timerEndsAt ?? null);
  trackingCode = computed(() => this.activeOrder()?.items[0]?.trackingCode ?? null);
  canViewBill = computed(() => {
    const status = this.orderStatus();
    return !!status && status !== 'PENDING_SUPERVISOR_APPROVAL';
  });
  /** Tracks whether the order was seen in the ready-for-pickup list */
  private readyOrderRef = signal<OrderGroup | null>(null);
  /** Set when the order leaves the ready list (supervisor confirmed pickup) */
  private confirmedPickup = signal(false);
  canDeliver = computed(() => this.confirmedPickup());

  copiedId = signal<string | null>(null);

  copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    this.copiedId.set(value);
    this.showToast('Copied!');
    setTimeout(() => { this.copiedId.set(null); }, 2000);
  }

  markDelivered() {
    const items = this.activeOrder()?.items?.filter(i => !(i as any)._actionDone) || [];
    if (items.length === 0) return;
    Swal.fire({
      title: 'Confirm Delivery',
      text: `Mark ${items.length} item${items.length > 1 ? 's' : ''} as delivered to the customer?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delivered',
      cancelButtonText: 'Cancel',
    }).then(result => {
      if (!result.isConfirmed) return;
      let completed = 0;
      items.forEach(item => {
        this.orderService.deliverOrder(item.id).subscribe({
          next: () => {
            (item as any)._actionDone = true;
            completed++;
            if (completed === items.length) {
              this.confirmedPickup.set(false);
              this.readyOrderRef.set(null);
              Swal.fire({ icon: 'success', title: 'Delivered!', timer: 1500, showConfirmButton: false });
              this.loadTab(this.tabId());
            }
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to mark delivered' });
          },
        });
      });
    });
  }
  private countdownTick = signal(0);

  get remainingSeconds(): number {
    const _ = this.countdownTick();
    const endsAt = this.timerEndsAt();
    if (!endsAt) return 0;
    return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  }

  get countdownLabel(): string {
    const s = this.remainingSeconds;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  private orderPosted = false;
  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

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

    this.pollSub = interval(15000).subscribe(() => {
      this.pollOrderStatus();
      this.pollNotifications();
    });

    this.countdownInterval = setInterval(() => {
      this.countdownTick.update(n => n + 1);
    }, 1000);
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
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
    if (!menuItemId) return 'Unknown Item';
    const menuItem = this.getMenuItem(menuItemId);
    return menuItem?.name || 'Unknown Item';
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
        this.pollOrderStatus();
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

  private pollOrderStatus() {
    const tid = this.tabId();
    if (!tid) return;

    const findMatch = (orders: OrderGroup[] | null) =>
      (orders || []).find(o => o.tabId === tid) || null;

    const onRdy = (ready: OrderGroup[] | null) => {
      const rmatch = findMatch(ready);
      if (rmatch) {
        this.readyOrderRef.set(rmatch);
        this.confirmedPickup.set(false);
        this.activeOrder.set(rmatch);
      } else if (this.readyOrderRef()) {
        this.confirmedPickup.set(true);
        this.activeOrder.set(this.readyOrderRef());
      }
    };

    const next = (orders: OrderGroup[] | null) => {
      const match = findMatch(orders);
      if (match) { this.activeOrder.set(match); return; }
      this.orderService.getPreparing().subscribe({
        next: (preparing) => {
          const pmatch = findMatch(preparing);
          if (pmatch) { this.activeOrder.set(pmatch); return; }
          this.orderService.getReadyForPickup().subscribe({
            next: (rdy) => onRdy(rdy),
            error: () => {}
          });
        },
        error: () => {
          this.orderService.getReadyForPickup().subscribe({
            next: (rdy) => onRdy(rdy),
            error: () => {}
          });
        }
      });
    };

    this.orderService.getPending().subscribe({
      next: (orders) => next(orders),
      error: () => {
        this.orderService.getPreparing().subscribe({
          next: (preparing) => {
            const pmatch = findMatch(preparing);
            if (pmatch) { this.activeOrder.set(pmatch); return; }
            this.orderService.getReadyForPickup().subscribe({
              next: (rdy) => onRdy(rdy),
              error: () => {}
            });
          },
          error: () => {
            this.orderService.getReadyForPickup().subscribe({
              next: (rdy) => onRdy(rdy),
              error: () => {}
            });
          }
        });
      }
    });
  }

  private pollNotifications() {
    this.notificationsApi.getUnread().subscribe({
      next: (notifications) => {
        const relevant = (notifications || []).find(n =>
          (n.type as NotificationType) === 'order_ready' &&
          n.message?.includes(this.tabId())
        );
        if (relevant) {
          this.notificationsApi.markRead(relevant.id).subscribe({ error: () => {} });
          this.pollOrderStatus();
        }
      },
      error: () => {}
    });
  }

  submitOrder() {
    if (this.items().length === 0) {
      this.showToast('Add items before submitting');
      return;
    }
    const body = this.items().map(item => ({
      menu_item_id: item.menuItemId ?? (item as any).menu_item_id ?? item.id,
      quantity: item.quantity,
      notes: item.notes || '',
    }));
    this.orderService.addItems(this.tabId(), body).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Order Submitted', text: 'Waiting for supervisor approval...', timer: 2000, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
        this.pollOrderStatus();
      },
      error: (err) => showApiErrorToast(err, 'Failed to submit order')
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
      text: `Remove ${this.getItemName(item)} from the tab?`,
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
        this.pollOrderStatus();
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
