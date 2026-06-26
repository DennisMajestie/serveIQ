import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { TabsApiService, OrdersApiService, TablesApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem, Table } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';

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

  tabId = signal('');
  tab = signal<Tab | null>(null);
  table = signal<Table | null>(null);
  items = signal<OrderItem[]>([]);
  isLoading = signal(true);

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
        this.loadTab(id);
      }
    });

    this.handleRouterState();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.handleRouterState();
    });
  }

  private handleRouterState() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { selectedItems?: Array<{ id: string; qty: number; selectedPortionId?: string; portionName?: string; portionPrice?: number; price: number }> } | undefined;
    if (state?.selectedItems?.length) {
      console.log('[TabDetail] Received selectedItems from router state:', state.selectedItems);
      this.addItemsFromMenu(state.selectedItems);
    }
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
        console.error('[TabDetail] Failed to load tab:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadOrders(tabId: string) {
    this.orderService.getByTab(tabId).subscribe({
      next: (items) => { this.items.set(items); this.isLoading.set(false); },
      error: (err) => {
        console.error('[TabDetail] Failed to load orders:', err);
        this.isLoading.set(false);
      }
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

  private addItemsFromMenu(selectedItems: Array<{ id: string; qty: number; selectedPortionId?: string; portionName?: string; portionPrice?: number; price: number }>) {
    const orderItems = selectedItems.map(item => ({
      menu_item_id: item.id,
      quantity: item.qty,
      notes: item.portionName ? `Portion: ${item.portionName}` : ''
    }));
    console.log('[TabDetail] Posting orderItems to API:', orderItems);
    this.orderService.addItems(this.tabId(), orderItems).subscribe({
      next: () => {
        this.loadOrders(this.tabId());
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} added to order`,
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('[TabDetail] Failed to add order items:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add order items'
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/tables']);
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
          error: (err: any) => {
            console.error('[TabDetail] Failed to close tab:', err);
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
}
