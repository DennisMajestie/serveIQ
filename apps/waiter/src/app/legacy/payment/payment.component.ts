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
  selectedMethod: 'cash' | 'card' | 'transfer' | 'ussd' | 'pos' = 'cash';
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

  isSplit = signal(false);
  splitCount = signal(2);
  splitAmounts = signal<number[]>([]);
  maxGuests = signal(0);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadTableInfo(id);
        this.loadTab(id);
        this.loadBill(id);
        this.loadTerminals();
      }
    });
  }

  private loadTab(tabId: string) {
    this.tabService.getTab(tabId).subscribe({
      next: (tab: Tab) => {
        this.maxGuests.set(tab.partySize || 1);
        if (tab.partySize && tab.partySize < this.splitCount()) {
          this.splitCount.set(Math.max(1, tab.partySize));
        }
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

  selectMethod(method: 'cash' | 'card' | 'transfer' | 'ussd' | 'pos') {
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

  toggleSplit() {
    this.isSplit.set(!this.isSplit());
    if (this.isSplit()) {
      this.distributeEqually();
    }
  }

  changeSplitCount(delta: number) {
    const max = this.maxGuests();
    const current = this.splitCount();
    const proposed = current + delta;
    if (proposed > max) {
      Swal.fire({ icon: 'warning', title: 'Maximum Participants Reached', text: `This table has ${max} guest${max > 1 ? 's' : ''}. You cannot split beyond that.`, background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    const newCount = Math.max(1, Math.min(max, proposed));
    this.splitCount.set(newCount);
    this.distributeEqually();
  }

  private distributeEqually() {
    const total = this.bill()?.totalKobo ?? 0;
    const count = this.splitCount();
    const each = Math.floor(total / count);
    const remainder = total - each * count;
    const amounts = Array(count).fill(each);
    amounts[amounts.length - 1] += remainder;
    this.splitAmounts.set(amounts);
  }

  getSplitNaira(index: number): string {
    return ((this.splitAmounts()[index] ?? 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  getRemainingKobo(): number {
    const total = this.bill()?.totalKobo ?? 0;
    const allocated = this.splitAmounts().reduce((sum, a) => sum + a, 0);
    return total - allocated;
  }

  get isSplitValid(): boolean {
    return this.splitAmounts().length === 0 || this.getRemainingKobo() === 0;
  }

  get totalPaidKobo(): number {
    const total = this.bill()?.totalKobo ?? 0;
    return total - this.getRemainingKobo();
  }

  get remainingNaira(): string {
    return (this.getRemainingKobo() / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  get paidNaira(): string {
    return (this.totalPaidKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  customizeSplit(index: number) {
    const currentNaira = (this.splitAmounts()[index] ?? 0) / 100;
    Swal.fire({
      title: `Guest ${index + 1} Amount`,
      html: `
        <div style="margin-bottom: 12px; color: #a0a0a0; font-size: 14px;">Enter amount in Naira (₦)</div>
        <input id="split-amount" type="number" step="0.01" value="${currentNaira}"
          style="width: 100%; padding: 14px; border-radius: 10px; border: 2px solid rgba(249,115,22,0.3); background: #1A1A1A; color: #fff; font-size: 24px; font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace; outline: none; box-sizing: border-box;" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Set',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316',
      didOpen: () => {
        const input = document.getElementById('split-amount') as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
      },
      preConfirm: () => {
        const val = parseFloat((document.getElementById('split-amount') as HTMLInputElement)?.value);
        if (isNaN(val) || val < 0) {
          Swal.showValidationMessage('Enter a valid amount');
          return false;
        }
        if (val * 100 > (this.bill()?.totalKobo ?? 0)) {
          Swal.showValidationMessage('Amount cannot exceed total');
          return false;
        }
        return Math.round(val * 100);
      }
    }).then(result => {
      if (result.isConfirmed) {
        const amounts = [...this.splitAmounts()];
        amounts[index] = result.value;
        this.splitAmounts.set(amounts);
      }
    });
  }

  confirmPayment() {
    if (this.isSplit() && !this.isSplitValid) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Allocation', text: 'Allocate the full bill amount across guests before completing payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }
    if (this.selectedMethod !== 'cash' && !this.selectedTerminalId()) {
      Swal.fire({ icon: 'warning', title: 'Terminal Required', text: 'Please select a POS terminal to process this payment.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
      return;
    }

    this.isProcessing.set(true);
    const amount = Math.round(parseFloat(this.currentAmount().replace(/,/g, '')) * 100);

    this.billsApi.recordPayment(this.tabId(), {
      amount,
      method: this.selectedMethod,
      terminal_id: this.selectedMethod !== 'cash' ? this.selectedTerminalId() : undefined,
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isSuccess.set(true);
        const allocations = this.isSplit() ? this.splitAmounts().map((k, i) => ({ guest: i + 1, amountKobo: k })) : [];
        setTimeout(() => this.router.navigate(['/tabs/receipt', this.tabId()], {
          state: {
            terminalLabel: this.selectedTerminalLabel(),
            showConfetti: true,
            splitAllocations: allocations,
          }
        }), 1000);
      },
      error: () => {
        this.isProcessing.set(false);
        Swal.fire({ icon: 'error', title: 'Payment Failed', text: 'Could not process payment. Please try again.', background: '#1e293b', color: '#fff', confirmButtonColor: '#f97316' });
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
