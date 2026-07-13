import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService, ShiftsApiService } from '@serveiq/shared/data-access';
import { Tab, Shift } from '@serveiq/shared/models';

interface Transaction {
  id: string;
  table: string;
  customer: string;
  status: string;
  statusIcon: string;
  amount: number;
  method: string;
}

interface ShiftGroup {
  shift: Shift;
  transactions: Transaction[];
  totalKobo: number;
}

@Component({
  selector: 'app-legacy-tab-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-history.component.html',
  styleUrls: ['./tab-history.component.scss']
})
export class LegacyTabHistoryComponent implements OnInit {
  private router = inject(Router);
  private tabsApi = inject(TabsApiService);
  private shiftsApi = inject(ShiftsApiService);

  isLoading = signal(true);
  closedTabs = signal<Tab[]>([]);
  shifts = signal<Shift[]>([]);
  expandedShift = signal<string | null>(null);

  shiftGroups = computed<ShiftGroup[]>(() => {
    const tabs = this.closedTabs();
    const shifts = this.shifts();
    if (!Array.isArray(tabs)) return [];

    const txns: Transaction[] = tabs.map(t => ({
      id: t.id,
      table: t.tableId ?? '—',
      customer: (t as any).customerName ?? 'Walk-in',
      status: t.status === 'paid' ? 'Paid' : t.status === 'voided' ? 'Voided' : t.status,
      statusIcon: t.status === 'paid' ? 'check_circle' : t.status === 'voided' ? 'cancel' : 'help',
      amount: (t as any).totalKobo ?? 0,
      method: (t as any).paymentMethod ?? 'Cash'
    }));

    const shiftMap = new Map(shifts.filter(s => s.id).map(s => [s.id, s]));

    const groups: ShiftGroup[] = [];
    const noShiftTxns: Transaction[] = [];

    for (const t of txns) {
      const tab = tabs.find(tab => tab.id === t.id);
      const shiftId = tab?.shiftId;
      if (shiftId && shiftMap.has(shiftId)) {
        let group = groups.find(g => g.shift.id === shiftId);
        if (!group) {
          group = { shift: shiftMap.get(shiftId)!, transactions: [], totalKobo: 0 };
          groups.push(group);
        }
        group.transactions.push(t);
        group.totalKobo += t.amount;
      } else {
        noShiftTxns.push(t);
      }
    }

    groups.sort((a, b) => new Date(b.shift.openedAt).getTime() - new Date(a.shift.openedAt).getTime());

    if (noShiftTxns.length > 0) {
      groups.push({
        shift: { id: '', branchId: '', openedAt: new Date(0), startingCashKobo: 0, status: 'closed' } as Shift,
        transactions: noShiftTxns,
        totalKobo: noShiftTxns.reduce((s, t) => s + t.amount, 0)
      });
    }

    return groups;
  });

  grandTotal = computed(() => this.shiftGroups().reduce((s, g) => s + g.totalKobo, 0) / 100);
  transactionCount = computed(() => this.shiftGroups().reduce((s, g) => s + g.transactions.length, 0));

  ngOnInit() {
    this.shiftsApi.list().subscribe({
      next: (shifts) => this.shifts.set(Array.isArray(shifts) ? shifts : [])
    });
    this.tabsApi.getAllTabs({ per_page: '1000' }).subscribe({
      next: (tabs) => {
        const closed = tabs.filter(t => t.status === 'paid' || t.status === 'voided');
        this.closedTabs.set(closed);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleShift(shiftId: string) {
    this.expandedShift.update(v => v === shiftId ? null : shiftId);
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  openTransactionById(id: string) {
    const tab = this.closedTabs().find(t => t.id === id);
    if (tab) {
      this.router.navigate(['/tabs/receipt', tab.id]);
    }
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}