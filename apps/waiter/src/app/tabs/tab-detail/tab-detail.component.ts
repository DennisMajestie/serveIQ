import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, MenuApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem, MenuItem } from '@serveiq/shared/models';
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
  private menuService = inject(MenuApiService);

  tabId = signal('');
  tab = signal<Tab | null>(null);
  items = signal<OrderItem[]>([]);
  isLoading = signal(true);
  menuItems: MenuItem[] = [];

  subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + (i.priceKobo * i.quantity), 0)
  );
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
  }

  loadTab(id: string) {
    this.tabService.getTab(id).subscribe({
      next: (tab) => {
        this.tab.set(tab);
        this.loadOrders(id);
      },
      error: () => {
        // If no existing tab, treat id as tableId and load orders empty
        this.isLoading.set(false);
      }
    });
  }

  loadOrders(tabId: string) {
    this.orderService.getByTab(tabId).subscribe({
      next: (items) => { this.items.set(items); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
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
    this.menuService.getAllItems().subscribe({
      next: (items) => {
        this.menuItems = items;
        this.openAddOrderDialog();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load menu items'
        });
      }
    });
  }

  openAddOrderDialog() {
    Swal.fire({
      title: 'Add Order Item',
      html: `
        <select id="swal-menu-item" class="swal2-input">
          <option value="">Select menu item</option>
        </select>
        <input id="swal-quantity" class="swal2-input" type="number" min="1" value="1" placeholder="Quantity">
        <input id="swal-notes" class="swal2-input" placeholder="Notes (optional)">
      `,
      confirmButtonText: 'Add Item',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: () => {
        const menuItemId = (document.getElementById('swal-menu-item') as HTMLSelectElement).value;
        const quantity = Number((document.getElementById('swal-quantity') as HTMLInputElement).value);
        const notes = (document.getElementById('swal-notes') as HTMLInputElement).value;

        if (!menuItemId) {
          Swal.showValidationMessage('Please select a menu item');
          return;
        }

        return { menuItemId, quantity, notes };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.orderService.addItems(this.tabId(), [result.value]).subscribe({
          next: () => {
            this.loadOrders(this.tabId());
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Order item added successfully',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to add order item'
            });
          }
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
      text: `Are you sure you want to close this tab? This will generate a bill.`,      icon: 'warning',
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
