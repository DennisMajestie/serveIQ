import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table, snakeToCamel } from '@serveiq/shared/models';
import { catchError, of, switchMap } from 'rxjs';

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
      const normalized = snakeToCamel<any>(result);
      const bill: any = normalized.bill || {};
      bill.branchId = bill.branchId || '';
      bill.serviceChargePercent = bill.serviceChargePercent ?? 10;
      bill.orderItems = (normalized.orders || []).map((o: any) => ({
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
}