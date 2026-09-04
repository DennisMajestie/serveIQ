import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BillsApiService, TabsApiService, TablesApiService, PosApiService } from '@serveiq/shared/data-access';
import { Bill, Tab, Table } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-legacy-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class LegacyPaymentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private billsApi = inject(BillsApiService);
  private tabService = inject(TabsApiService);
  private tableService = inject(TablesApiService);
  private posApi = inject(PosApiService);

  tabId = signal('');
  table = signal<Table | null>(null);
  bill = signal<Bill | null>(null);
  isLoading = signal(true);
  selectedMethod: 'cash' | 'card' | 'transfer' | 'ussd' = 'cash';
  currentAmount = signal('0');
  isEditingAmount = false;
  isProcessing = signal(false);
  isSuccess = signal(false);
  terminals = signal<any[]>([]);
  selectedTerminalId = signal('');
  selectedTerminalLabel = computed(() => {
    const id = this.selectedTerminalId();
    if (!id) return '';
    return this.terminals().find(t => t.id === id)?.label ?? '';
  });

  orders = signal<any[]>([]);

  pendingCount = computed(() => this.orders().filter(o => {
    const s = (o.order_status ?? o.orderStatus ?? '').toString().toLowerCase();
    const billable = s !== 'declined' && s !== 'cancelled';
    const fulfilled = s === 'delivered' || s === 'completed';
    return billable && !fulfilled && s !== 'pending_payment_approval';
  }).length);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTableInfo(id);
        this.loadBill(id);
        this.loadTerminals();
      }
    });
  }

  private loadTerminals() {
    this.posApi.getAll().subscribe({
      next: (terminals) => this.terminals.set(Array.isArray(terminals) ? terminals : []),
      error: () => {}
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

  private loadBill(tabId: string) {
    this.billsApi.getReceipt(tabId).subscribe({
      next: (receipt: any) => {
        const b = receipt.bill as Bill;
        this.bill.set(b);
        this.orders.set(receipt.orders || []);
        this.currentAmount.set((b.totalKobo / 100).toFixed(2));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get totalDueNaira(): string {
    const total = this.bill()?.totalKobo ?? 0;
    return (total / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
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
    if (this.pendingCount() > 0) {
      Swal.fire({ icon: 'warning', title: 'Items Pending Fulfillment', text: `${this.pendingCount()} item${this.pendingCount() === 1 ? ' is' : 's are'} still pending fulfillment. Mark all items as delivered before completing payment.`, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    if (this.selectedMethod !== 'cash' && !this.selectedTerminalId()) {
      Swal.fire({ icon: 'warning', title: 'Terminal Required', text: 'Please select a POS terminal to process this payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }

    Swal.fire({
      title: 'Confirm Payment?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 12px;">Once confirmed, this transaction <strong>cannot be reversed</strong> through the terminal. Any refund or adjustment must be handled by management.</p>
          <p style="margin:0 0 12px;">Please verify the following before proceeding:</p>
          <ul style="padding-left:18px;margin:0 0 12px;">
            <li>The amount entered is correct.</li>
            <li>The payment method selected matches what the guest is using.</li>
          </ul>
          <p style="margin:0;opacity:0.7;font-size:12px;">By confirming, you accept responsibility for this transaction.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete Payment',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      background: '#1e293b',
      color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;

      this.isProcessing.set(true);
      const amount = Math.round(parseFloat(this.currentAmount().replace(/,/g, '')) * 100);
      const apiMethod = this.selectedMethod === 'ussd' ? 'transfer' : this.selectedMethod;

      this.billsApi.recordPayment(this.tabId(), {
        amount,
        method: apiMethod,
        terminal_id: this.selectedMethod !== 'cash' ? this.selectedTerminalId() : undefined,
      }).subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.isSuccess.set(true);
          setTimeout(() => this.router.navigate(['/tabs/receipt', this.tabId()], {
            state: {
              terminalLabel: this.selectedTerminalLabel(),
              showConfetti: true,
            }
          }), 1000);
        },
        error: () => {
          this.isProcessing.set(false);
          Swal.fire({ icon: 'error', title: 'Payment Failed', text: 'Could not process payment. Please try again.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
        }
      });
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
