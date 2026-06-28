import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table } from '@serveiq/shared/models';
import { catchError, of, switchMap } from 'rxjs';
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

  tabId = signal('');
  bill = signal<Bill | null>(null);
  table = signal<Table | null>(null);
  isLoading = signal(true);
  error = signal('');
  waiterName = signal('Waiter');
  time = signal(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTabAndGenerateBill(id);
      }
    });
  }

  loadTabAndGenerateBill(tabId: string) {
    this.tabService.getTab(tabId).subscribe({
      next: (tab: Tab) => {
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

  private loadBill(tabId: string) {
    this.billService.getReceipt(tabId).pipe(
      catchError(() =>
        this.billService.generate(tabId, { serviceChargePercent: 5 }).pipe(
          switchMap(() => this.billService.getReceipt(tabId)),
          catchError(() => of(null))
        )
      )
    ).subscribe((result: any) => {
      if (!result) {
        this.error.set('Could not generate bill. Please try again.');
        this.isLoading.set(false);
        return;
      }
      const bill: any = result.bill || {};
      bill.branchId = bill.branchId || '';
      bill.serviceChargePercent = bill.serviceChargePercent ?? 10;
      bill.orderItems = (result.orders || []).map((o: any) => ({
        ...o,
        menuItemName: o.menuItemName || o.menuItem?.name || '',
        menuItemId: o.menuItemId || o.menuItem?.id || '',
        priceKobo: o.priceKobo || o.unitPriceKobo || 0,
      }));
      this.bill.set(bill as Bill);
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
    this.billService.generate(this.tabId(), {
      serviceChargePercent: 5,
      discountKobo
    }).pipe(
      switchMap(() => this.billService.getReceipt(this.tabId())),
      catchError(() => of(null))
    ).subscribe((result: any) => {
      if (!result) {
        this.error.set('Could not apply discount. Please try again.');
        this.isLoading.set(false);
        return;
      }
      const bill: any = result.bill || {};
      bill.branchId = bill.branchId || '';
      bill.serviceChargePercent = bill.serviceChargePercent ?? 10;
      bill.orderItems = (result.orders || []).map((o: any) => ({
        ...o,
        menuItemName: o.menuItemName || o.menuItem?.name || '',
        menuItemId: o.menuItemId || o.menuItem?.id || '',
        priceKobo: o.priceKobo || o.unitPriceKobo || 0,
      }));
      this.bill.set(bill as Bill);
      this.isLoading.set(false);
    });
  }
}