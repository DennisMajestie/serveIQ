import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService, TablesApiService, ShiftsApiService, OfflineCacheService } from '@serveiq/shared/data-access';
import { Tab, Shift } from '@serveiq/shared/models';
import { of, forkJoin, switchMap, map, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';

interface Transaction {
  id: string;
  table: string;
  customer: string;
  status: string;
  statusIcon: string;
  amount: number;
  method: string;
  countedInTotal: boolean;
}

interface ShiftGroup {
  shift: Shift;
  transactions: Transaction[];
  totalKobo: number;
  salesCount: number;
  voidedCount: number;
}

interface TabRow {
  tab: Tab;
  billTotalKobo: number | null;
}

@Component({
  selector: 'app-tab-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-history.component.html',
  styleUrls: ['./tab-history.component.scss']
})
export class TabHistoryComponent implements OnInit {
  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  private router = inject(Router);
  private tabsApi = inject(TabsApiService);
  private tablesApi = inject(TablesApiService);
  private shiftsApi = inject(ShiftsApiService);
  private currency = inject(CurrencyContextService);
  private offlineData = inject(OfflineDataService);
  private cache = inject(OfflineCacheService);

  isLoading = signal(true);
  rows = signal<TabRow[]>([]);
  shifts = signal<Shift[]>([]);
  expandedShift = signal<string | null>(null);

  tableNumbers = signal<Record<string, string>>({});

  currencySymbol = computed(() => this.currency.getSymbol());

  shiftGroups = computed<ShiftGroup[]>(() => {
    const rows = this.rows();
    const shifts = this.shifts();
    const tableNums = this.tableNumbers();

    const shiftMap = new Map(shifts.filter(s => s.id).map(s => [s.id, s]));
    const groups: ShiftGroup[] = [];
    const noShiftTxns: Transaction[] = [];

    const addToGroup = (group: ShiftGroup, txn: Transaction) => {
      group.transactions.push(txn);
      if (txn.countedInTotal) {
        group.totalKobo += txn.amount;
        group.salesCount++;
      } else {
        group.voidedCount++;
      }
    };

    for (const { tab, billTotalKobo } of rows) {
      // Settled amount = the bill total actually paid (charges + VAT − discount),
      // falling back to the tab subtotal when no bill exists yet.
      const amount = tab.status === 'paid'
        ? (billTotalKobo ?? (tab as any).totalKobo ?? 0)
        : ((tab as any).totalKobo ?? 0);
      const txn: Transaction = {
        id: tab.id,
        table: tab.tableId ? (tableNums[tab.tableId] || '—') : '—',
        customer: (tab as any).customerName ?? 'Walk-in',
        status: tab.status === 'paid' ? 'Paid' : tab.status === 'voided' ? 'Voided' : tab.status,
        statusIcon: tab.status === 'paid' ? 'check_circle' : tab.status === 'voided' ? 'cancel' : 'help',
        amount,
        method: (tab as any).paymentMethod ?? 'Cash',
        countedInTotal: tab.status === 'paid',
      };
      const shiftId = (tab as any).shiftId;
      if (shiftId && shiftMap.has(shiftId)) {
        let group = groups.find(g => g.shift.id === shiftId);
        if (!group) {
          group = { shift: shiftMap.get(shiftId)!, transactions: [], totalKobo: 0, salesCount: 0, voidedCount: 0 };
          groups.push(group);
        }
        addToGroup(group, txn);
      } else {
        noShiftTxns.push(txn);
      }
    }

    groups.sort((a, b) => new Date(b.shift.openedAt).getTime() - new Date(a.shift.openedAt).getTime());

    if (noShiftTxns.length > 0) {
      groups.push({
        shift: { id: '', branchId: '', openedAt: new Date(0), startingCashKobo: 0, status: 'closed' } as Shift,
        transactions: noShiftTxns,
        totalKobo: noShiftTxns.reduce((s, t) => s + (t.countedInTotal ? t.amount : 0), 0),
        salesCount: noShiftTxns.filter(t => t.countedInTotal).length,
        voidedCount: noShiftTxns.filter(t => !t.countedInTotal).length,
      });
    }

    return groups;
  });

  grandTotalKobo = computed(() => this.shiftGroups().reduce((s, g) => s + g.totalKobo, 0));
  salesCount = computed(() => this.rows().filter(r => r.tab.status === 'paid').length);
  voidedCount = computed(() => this.rows().filter(r => r.tab.status !== 'paid').length);

  ngOnInit() {
    this.shiftsApi.list().subscribe({
      next: (shifts) => {
        this.shifts.set(Array.isArray(shifts) ? shifts : []);
      }
    });
    const waiterId = localStorage.getItem('userId');
    this.tabsApi.getAllTabsUnpaginated({
      status: 'paid,voided',
      ...(waiterId ? { waiter_id: waiterId } : {}),
    }).pipe(
      catchError(() => this.cache.getCached<Tab>('tabs')),
      map(tabs => (Array.isArray(tabs) ? tabs : []).filter(t => t.status === 'paid' || t.status === 'voided')),
      switchMap(tabs => {
        if (tabs.length === 0) return of<TabRow[]>([]);
        return forkJoin(tabs.map(tab =>
          tab.status === 'paid'
            ? this.offlineData.getBill(tab.id).pipe(
                map(bill => ({ tab, billTotalKobo: bill ? (bill.totalKobo ?? null) : null })),
                catchError(() => of<TabRow>({ tab, billTotalKobo: null }))
              )
            : of<TabRow>({ tab, billTotalKobo: null })
        ));
      })
    ).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.isLoading.set(false);
        this.loadTableNumbers();
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load History', background: '#1A1A1A', color: '#fff', confirmButtonColor: '#f97316' });
      }
    });
  }

  private loadTableNumbers() {
    this.offlineData.getTables().subscribe({
      next: (tables) => {
        const map: Record<string, string> = {};
        (Array.isArray(tables) ? tables : []).forEach(t => {
          if (t.id) map[t.id] = `Table ${t.tableNumber}`;
        });
        this.tableNumbers.set(map);
      }
    });
  }

  toggleShift(shiftId: string) {
    this.expandedShift.update(v => v === shiftId ? null : shiftId);
  }

  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  openTransactionById(id: string) {
    this.router.navigate(['/tabs/receipt', id]);
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }
}