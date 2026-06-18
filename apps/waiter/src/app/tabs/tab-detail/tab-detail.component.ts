import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService } from '@serveiq/shared/data-access';
import { Tab, OrderItem } from '@serveiq/shared/models';
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
  private tabsApi = inject(TabsApiService);
  private ordersApi = inject(OrdersApiService);

  tabId = signal('');
  tab = signal<Tab | null>(null);
  items = signal<OrderItem[]>([]);
  isLoading = signal(true);

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
    this.tabsApi.getTab(id).subscribe({
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
    this.ordersApi.getByTab(tabId).subscribe({
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
        this.ordersApi.deleteItem(item.id).subscribe(() =>
          this.items.update(is => is.filter(i => i.id !== item.id))
        );
      }
    });
  }

  addItem() {
    this.router.navigate(['/menu'], { queryParams: { tabId: this.tabId() } });
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  viewBill() {
    this.router.navigate(['/tabs/bill', this.tabId()]);
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }
}
