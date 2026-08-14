import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService, TabsApiService, OrdersApiService, MenuApiService, BusinessApiService, OfflineCacheService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table, MenuItem, Business } from '@serveiq/shared/models';
import { catchError, of, switchMap, map, from } from 'rxjs';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';

@Component({
  selector: 'app-bill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss']
})
export class BillComponent implements OnInit {
  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private billService = inject(BillsApiService);
  private tableService = inject(TablesApiService);
  private tabService = inject(TabsApiService);
  private ordersService = inject(OrdersApiService);
  private menuService = inject(MenuApiService);
  private businessApi = inject(BusinessApiService);
  private currency = inject(CurrencyContextService);
  private offlineData = inject(OfflineDataService);
  private cache = inject(OfflineCacheService);

  private currentDiscountKobo = 0;

  tabId = signal('');
  bill = signal<Bill | null>(null);
  table = signal<Table | null>(null);
  isLoading = signal(true);
  error = signal('');
  waiterName = signal('Waiter');
  time = signal(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  menuItems = signal<MenuItem[]>([]);
  businessSettings = signal<Business | null>(null);

  subtotalNaira = computed(() => (this.bill()?.subtotalKobo ?? 0) / 100);
  serviceChargeNaira = computed(() => (this.bill()?.serviceChargeKobo ?? 0) / 100);
  discountNaira = computed(() => (this.bill()?.discountKobo ?? 0) / 100);
  totalNaira = computed(() => (this.bill()?.totalKobo ?? 0) / 100);

  items = computed(() => this.bill()?.orderItems ?? []);

  pendingItems = computed(() => this.items().filter(i => {
    const s = ((i as any).orderStatus ?? (i as any).order_status ?? '').toString().toLowerCase();
    const billable = s !== 'declined' && s !== 'cancelled';
    const fulfilled = s === 'delivered' || s === 'completed';
    return billable && !fulfilled && s !== 'pending_payment_approval';
  }));

  pendingCount = computed(() => this.pendingItems().length);

  currencySymbol = computed(() => this.currency.getSymbol());
  currencyCode = computed(() => this.currency.getCode());

  getSubtotal = () => this.subtotalNaira();
  getVat = () => Math.round((this.subtotalNaira() * (this.businessSettings()?.taxRate || 7.5) / 100) * 100) / 100;
  getServiceCharge = () => this.serviceChargeNaira();
  getTotal = () => this.totalNaira();

  formatAmount(amount: number): string {
    return this.currency.formatPlain(amount);
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  ngOnInit() {
    this.menuService.getAllItems().subscribe({
      next: (items) => this.menuItems.set(items || []),
      error: () => {}
    });
    this.businessApi.getBusiness().subscribe({
      next: (business) => this.businessSettings.set(business),
      error: () => {}
    });
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTabAndGenerateBill(id);
      }
    });
  }

  getItemName(item: any): string {
    const directName = item.menuItemName || item.menu_item_name || '';
    if (directName) return directName;
    const menuItemId = item.menuItemId ?? item.menu_item_id ?? '';
    if (!menuItemId) return 'Unknown Item';
    const menuItem = this.menuItems().find(m => m.id === menuItemId);
    return menuItem?.name || 'Unknown Item';
  }

  private orderStatusOf(item: any): string {
    return (item?.orderStatus ?? item?.order_status ?? '').toString().toLowerCase();
  }

  isFulfilled(item: any): boolean {
    const s = this.orderStatusOf(item);
    return s === 'delivered' || s === 'completed';
  }

  isPending(item: any): boolean {
    const s = this.orderStatusOf(item);
    const billable = s !== 'declined' && s !== 'cancelled';
    return billable && !this.isFulfilled(item) && s !== 'pending_payment_approval';
  }

  statusLabel(item: any): string {
    const labels: Record<string, string> = {
      pending_payment_approval: 'Awaiting Payment',
      pending_supervisor_approval: 'Pending Approval',
      approved: 'Approved',
      assigned_to_department: 'In Kitchen',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready for Pickup',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      completed: 'Completed',
      declined: 'Declined',
      cancelled: 'Cancelled',
    };
    return labels[this.orderStatusOf(item)] ?? 'Pending';
  }

  loadTabAndGenerateBill(tabId: string) {
    this.offlineData.getTab(tabId).subscribe({
      next: (tab: Tab | null) => {
        if (!tab) { this.loadBill(tabId); return; }
        this.waiterName.set((tab as any).waiter?.fullName || 'Waiter');
        if (tab.tableId) {
          this.tableService.getTable(tab.tableId).subscribe({
            next: (table) => this.table.set(table)
          });
        }
        this.loadBill(tabId);
      },
      error: () => {
        this.loadBill(tabId);
      }
    });
  }

  private mapOrderItems(items: any[]): any[] {
    return (items || []).map((o: any) => ({
      ...o,
      menuItemId: o.menuItemId ?? o.menu_item_id ?? o.menuItem?.id ?? o.menu_item?.id ?? '',
      priceKobo: o.priceKobo ?? o.unitPriceKobo ?? o.unit_price_kobo ?? 0,
    }));
  }

  private buildBillFromOrders(tabId: string, discountKobo: number, orderItems: any[]): Bill {
    const subtotalKobo = orderItems.reduce((s, o) => s + (o.priceKobo || 0) * (o.quantity || 1), 0);
    const serviceChargePercent = Number(this.businessSettings()?.serviceChargePercent ?? 10);
    const serviceChargeKobo = Math.round(subtotalKobo * (serviceChargePercent / 100));
    const vatKobo = Math.round(subtotalKobo * 0.075);
    const totalKobo = subtotalKobo + serviceChargeKobo + vatKobo - discountKobo;
    return {
      id: '',
      tabId,
      branchId: '',
      subtotalKobo,
      serviceChargeKobo,
      serviceChargePercent,
      discountKobo,
      totalKobo,
      createdAt: new Date(),
      orderItems,
    };
  }

  private loadBill(tabId: string) {
    this.isLoading.set(true);
    this.error.set('');
    this.cache.getByIndex<Bill>('bills', 'tab_id', tabId).pipe(
      map(bills => {
        const sorted = [...(bills || [])].sort((a, b) =>
          (new Date((b as any).createdAt ?? 0) as any) - (new Date((a as any).createdAt ?? 0) as any));
        return sorted.length > 0 ? sorted[0] : null;
      }),
      switchMap(cached =>
        cached
          ? of(cached)
          : this.offlineData.getBill(tabId).pipe(
              switchMap(bill =>
                bill
                  ? of(bill)
                  : from(this.offlineData.generateBill(tabId)).pipe(
                      map(gen => ((gen as any)?.offline || !(gen as any)?.id) ? null : gen),
                      catchError(() => of(null))
                    )
              ),
              catchError(() => of(null))
            )
      ),
      switchMap(bill => {
        if (!bill) {
          return this.offlineData.getOrdersByTab(tabId).pipe(
            map(orders => this.buildBillFromOrders(tabId, this.currentDiscountKobo, this.mapOrderItems(orders))),
            catchError(() => of(null))
          );
        }
        return this.offlineData.getOrdersByTab(tabId).pipe(
          map(orders => {
            bill.orderItems = this.mapOrderItems(orders);
            this.currentDiscountKobo = bill.discountKobo;
            return bill;
          }),
          catchError(() => of(bill))
        );
      }),
      catchError(() =>
        this.offlineData.getOrdersByTab(tabId).pipe(
          map(orders => this.buildBillFromOrders(tabId, this.currentDiscountKobo, this.mapOrderItems(orders))),
          catchError(() => of(null))
        )
      )
    ).subscribe((bill: Bill | null) => {
      if (!bill) {
        this.error.set('Could not generate bill. Please try again.');
        this.isLoading.set(false);
        return;
      }
      this.cache.upsert('bills', { ...bill, tab_id: (bill as any).tab_id ?? (bill as any).tabId });
      this.bill.set(bill);
      this.isLoading.set(false);
    });
  }

  proceedToPayment() {
    this.router.navigate(['/tabs/payment', this.tabId()]);
  }

  goBack() {
    this.router.navigate(['/tabs/detail', this.tabId()]);
  }

  addItems() {
    this.router.navigate(['/menu'], {
      queryParams: { tabId: this.tabId() }
    });
  }

  get hasDiscount(): boolean {
    return (this.bill()?.discountKobo ?? 0) > 0;
  }

  applyDiscount() {
    const currentKobo = this.bill()?.discountKobo ?? 0;
    const currentAmount = currentKobo / 100;

    Swal.fire({
      title: 'Apply Discount',
      html: `
        <div style="margin-bottom: 16px; color: #a0a0a0; font-size: 14px;">
          Enter amount in ${this.currencySymbol}
        </div>
        <input
          id="discount-input"
          type="number"
          min="0"
          step="0.01"
          value="${currentAmount || ''}"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 28px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box;"
          placeholder="0.00"
        />
        <div style="margin-top: 8px; color: #666; font-size: 12px;">
          Max: ${this.currencySymbol}${this.formatAmount(this.subtotalNaira())}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Apply',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      didOpen: () => {
        const input = document.getElementById('discount-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      },
      preConfirm: () => {
        const input = document.getElementById('discount-input') as HTMLInputElement;
        const value = parseFloat(input?.value);
        if (isNaN(value) || value < 0) {
          Swal.showValidationMessage('Please enter a valid amount');
          return false;
        }
        if (value > this.subtotalNaira()) {
          Swal.showValidationMessage('Discount cannot exceed subtotal of ' + this.currencySymbol + this.formatAmount(this.subtotalNaira()));
          return false;
        }
        return Math.round(value * 100);
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.applyDiscountToBill(result.value);
      }
    });
  }

  removeDiscount() {
    Swal.fire({
      title: 'Remove Discount?',
      text: 'This will remove the current discount and regenerate the bill.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.applyDiscountToBill(0);
      }
    });
  }

  private applyDiscountToBill(discountKobo: number) {
    this.isLoading.set(true);
    this.error.set('');
    this.billService.applyDiscount(this.tabId(), { discountKobo }).pipe(
      switchMap((bill) =>
        this.offlineData.getOrdersByTab(this.tabId()).pipe(
          map((items) => {
            const orderItems = this.mapOrderItems(items);
            bill.orderItems = orderItems;
            this.currentDiscountKobo = bill.discountKobo;
            return { ...bill, ...this.buildBillFromOrders(this.tabId(), bill.discountKobo ?? discountKobo, orderItems), orderItems };
          }),
          catchError(() => of(bill))
        )
      ),
      catchError(() =>
        from(this.offlineData.generateBill(this.tabId(), { discountKobo })).pipe(
          switchMap((bill) =>
            this.offlineData.getOrdersByTab(this.tabId()).pipe(
              map((items) => {
                const orderItems = this.mapOrderItems(items);
                const computed = this.buildBillFromOrders(this.tabId(), discountKobo, orderItems);
                this.currentDiscountKobo = discountKobo;
                return { ...computed, ...bill, orderItems };
              }),
              catchError(() => of(bill))
            )
          ),
          catchError(() =>
            this.offlineData.getOrdersByTab(this.tabId()).pipe(
              map((items) => {
                const orderItems = this.mapOrderItems(items);
                this.currentDiscountKobo = discountKobo;
                return this.buildBillFromOrders(this.tabId(), discountKobo, orderItems);
              }),
              catchError(() => of(null))
            )
          )
        )
      )
    ).subscribe((bill: Bill | null) => {
      if (!bill) {
        this.error.set('Could not apply discount. Please try again.');
        this.isLoading.set(false);
        return;
      }
      this.cache.upsert('bills', { ...bill, tab_id: (bill as any).tab_id ?? (bill as any).tabId });
      this.bill.set(bill);
      this.isLoading.set(false);
    });
  }
}