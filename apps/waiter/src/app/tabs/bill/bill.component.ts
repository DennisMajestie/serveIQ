import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService, TabsApiService, OrdersApiService, MenuApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table, MenuItem } from '@serveiq/shared/models';
import { catchError, of, switchMap, map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss']
})
export class BillComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private billService = inject(BillsApiService);
  private tableService = inject(TablesApiService);
  private tabService = inject(TabsApiService);
  private ordersService = inject(OrdersApiService);
  private menuService = inject(MenuApiService);

  private currentDiscountKobo = 0;

  tabId = signal('');
  bill = signal<Bill | null>(null);
  table = signal<Table | null>(null);
  isLoading = signal(true);
  error = signal('');
  waiterName = signal('Waiter');
  time = signal(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  menuItems = signal<MenuItem[]>([]);

  subtotalNaira = computed(() => (this.bill()?.subtotalKobo ?? 0) / 100);
  serviceChargeNaira = computed(() => (this.bill()?.serviceChargeKobo ?? 0) / 100);
  discountNaira = computed(() => (this.bill()?.discountKobo ?? 0) / 100);
  totalNaira = computed(() => (this.bill()?.totalKobo ?? 0) / 100);

  items = computed(() => this.bill()?.orderItems ?? []);

  getSubtotal = () => this.subtotalNaira();
  getVat = () => Math.round((this.subtotalNaira() * 0.075) * 100) / 100;
  getServiceCharge = () => this.serviceChargeNaira();
  getTotal = () => this.totalNaira();

  ngOnInit() {
    this.menuService.getAllItems().subscribe({
      next: (items) => this.menuItems.set(items || []),
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

  loadTabAndGenerateBill(tabId: string) {
    this.tabService.getTab(tabId).subscribe({
      next: (tab: Tab) => {
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
      priceKobo: o.priceKobo ?? o.unitPriceKobo ?? 0,
    }));
  }

  private buildBillFromOrders(tabId: string, discountKobo: number, orderItems: any[]): Bill {
    const subtotalKobo = orderItems.reduce((s, o) => s + (o.priceKobo || 0) * (o.quantity || 1), 0);
    const serviceChargeKobo = Math.round(subtotalKobo * 0.05);
    const vatKobo = Math.round(subtotalKobo * 0.075);
    const totalKobo = subtotalKobo + serviceChargeKobo + vatKobo - discountKobo;
    return {
      id: '',
      tabId,
      branchId: '',
      subtotalKobo,
      serviceChargeKobo,
      serviceChargePercent: 5,
      discountKobo,
      totalKobo,
      createdAt: new Date(),
      orderItems,
    };
  }

  private loadBill(tabId: string) {
    this.isLoading.set(true);
    this.error.set('');
    this.billService.generate(tabId, { serviceChargePercent: 5 }).pipe(
      switchMap((bill) =>
        this.ordersService.getByTab(tabId).pipe(
          map((items) => {
            bill.orderItems = this.mapOrderItems(items);
            this.currentDiscountKobo = bill.discountKobo;
            return bill;
          }),
          catchError(() => of(bill))
        )
      ),
      catchError(() =>
        this.ordersService.getByTab(tabId).pipe(
          map((items) => {
            const orderItems = this.mapOrderItems(items);
            return this.buildBillFromOrders(tabId, this.currentDiscountKobo, orderItems);
          }),
          catchError(() => of(null))
        )
      )
    ).subscribe((bill: Bill | null) => {
      if (!bill) {
        this.error.set('Could not generate bill. Please try again.');
        this.isLoading.set(false);
        return;
      }
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

  formatNaira(amount: number): string {
    return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get hasDiscount(): boolean {
    return (this.bill()?.discountKobo ?? 0) > 0;
  }

  applyDiscount() {
    const currentKobo = this.bill()?.discountKobo ?? 0;
    const currentNaira = currentKobo / 100;

    Swal.fire({
      title: 'Apply Discount',
      html: `
        <div style="margin-bottom: 16px; color: #a0a0a0; font-size: 14px;">
          Enter amount in Naira (₦)
        </div>
        <input
          id="discount-input"
          type="number"
          min="0"
          step="0.01"
          value="${currentNaira || ''}"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 28px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box;"
          placeholder="0.00"
        />
        <div style="margin-top: 8px; color: #666; font-size: 12px;">
          Max: ₦${this.formatNaira(this.subtotalNaira())}
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
          Swal.showValidationMessage('Discount cannot exceed subtotal of ₦' + this.formatNaira(this.subtotalNaira()));
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
        this.ordersService.getByTab(this.tabId()).pipe(
          map((items) => {
            bill.orderItems = this.mapOrderItems(items);
            this.currentDiscountKobo = bill.discountKobo;
            return bill;
          }),
          catchError(() => of(bill))
        )
      ),
      catchError(() =>
        this.billService.generate(this.tabId(), { serviceChargePercent: 5, discountKobo }).pipe(
          switchMap((bill) =>
            this.ordersService.getByTab(this.tabId()).pipe(
              map((items) => {
                bill.orderItems = this.mapOrderItems(items);
                this.currentDiscountKobo = bill.discountKobo;
                return bill;
              }),
              catchError(() => of(bill))
            )
          ),
          catchError(() =>
            this.ordersService.getByTab(this.tabId()).pipe(
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
      this.bill.set(bill);
      this.isLoading.set(false);
    });
  }
}