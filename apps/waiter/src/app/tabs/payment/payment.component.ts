import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BillsApiService, TabsApiService, TablesApiService } from '@serveiq/shared/data-access';
import { Tab, Table } from '@serveiq/shared/models';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private billsApi = inject(BillsApiService);
  private tabService = inject(TabsApiService);
  private tableService = inject(TablesApiService);

  tabId = signal('');
  table = signal<Table | null>(null);
  selectedMethod: 'cash' | 'card' | 'transfer' | 'ussd' = 'cash';
  currentAmount = signal('0');
  isEditingAmount = false;
  isProcessing = signal(false);
  isSuccess = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTableInfo(id);
      }
    });
  }

  loadTableInfo(tabId: string) {
    this.tabService.getTab(tabId).subscribe({
      next: (tab: Tab) => {
        if (tab.tableId) {
          this.tableService.getTable(tab.tableId).subscribe({
            next: (table) => this.table.set(table)
          });
        }
      }
    });
  }

  get formattedAmount(): string {
    const parts = this.currentAmount().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  selectMethod(method: 'cash' | 'card' | 'transfer' | 'ussd') {
    this.selectedMethod = method;
  }

  appendNumber(num: string) {
    if (!this.isEditingAmount) {
      this.currentAmount.set('');
      this.isEditingAmount = true;
    }
    let clean = this.currentAmount().replace(/,/g, '');
    if (num === '.' && clean.includes('.')) return;
    this.currentAmount.set(clean + num);
  }

  clearLast() {
    let clean = this.currentAmount().replace(/,/g, '').slice(0, -1);
    this.currentAmount.set(clean || '0');
    if (!clean) this.isEditingAmount = false;
  }

  confirmPayment() {
    this.isProcessing.set(true);
    const amount = Math.round(parseFloat(this.currentAmount().replace(/,/g, '')) * 100);

    this.billsApi.recordPayment(this.tabId(), {
      amount,
      method: this.selectedMethod,
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isSuccess.set(true);
        setTimeout(() => this.router.navigate(['/tabs/receipt', this.tabId()]), 1000);
      },
      error: () => {
        this.isProcessing.set(false);
      }
    });
  }

  getButtonText(): string {
    if (this.isProcessing()) return 'Processing...';
    if (this.isSuccess()) return 'Payment Successful ✓';
    return 'Confirm Payment';
  }

  goBack() {
    this.router.navigate(['/tabs/bill', this.tabId()]);
  }
}
