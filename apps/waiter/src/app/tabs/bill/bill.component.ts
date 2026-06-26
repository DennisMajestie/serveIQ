import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table } from '@serveiq/shared/models';

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
  serviceChargeNaira = computed(() =>
    ((this.bill()?.subtotalKobo ?? 0) * (this.bill()?.serviceChargePercent ?? 0)) / 10000
  );
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
        this.generateBill(tabId);
      },
      error: () => {
        this.generateBill(tabId); // still try to generate bill even if tab load fails
      }
    });
  }

  generateBill(tabId: string) {
    this.billService.generate(tabId, { serviceChargePercent: 5 }).subscribe({
      next: (bill) => { this.bill.set(bill); this.isLoading.set(false); },
      error: (err) => {
        this.error.set('Could not generate bill. Please try again.');
        this.isLoading.set(false);
      }
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