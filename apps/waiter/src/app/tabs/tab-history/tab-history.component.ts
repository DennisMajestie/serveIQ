import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService, TablesApiService, ShiftsApiService, OfflineCacheService } from '@serveiq/shared/data-access';
import { Tab, Shift } from '@serveiq/shared/models';
import { map, catchError } from 'rxjs';
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
}

interface ShiftGroup {
  shift: Shift;
  transactions: Transaction[];
  totalKobo: number;
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
  closedTabs = signal<Tab[]>([]);
  shifts = signal<Shift[]>([]);
  expandedShift = signal<string | null>(null);

  tableNumbers = signal<Record<string, string>>({});

  currencySymbol = computed(() => this.currency.getSymbol());

  shiftGroups = computed<ShiftGroup[]>(() => {
    const tabs = this.closedTabs();
    const shifts = this.shifts();
    const tableNums = this.tableNumbers();
    if (!Array.isArray(tabs)) return [];

    const txns: Transaction[] = tabs.map(t => ({
      id: t.id,
      table: t.tableId ? (tableNums[t.tableId] || t.tableId.slice(0, 8)) : '—',
      customer: t.customerName ?? 'Walk-in',
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

  grandTotalKobo = computed(() => this.shiftGroups().reduce((s, g) => s + g.totalKobo, 0));
  transactionCount = computed(() => this.shiftGroups().reduce((s, g) => s + g.transactions.length, 0));

  ngOnInit() {
    this.shiftsApi.list().subscribe({
      next: (shifts) => {
        this.shifts.set(Array.isArray(shifts) ? shifts : []);
      }
    });
    this.tabsApi.getAllTabsUnpaginated({ status: 'paid,voided' }).pipe(
      catchError(() => this.cache.getCached<Tab>('tabs')),
      map(tabs => {
        const arr = Array.isArray(tabs) ? tabs : [];
        return arr.filter(t => t.status === 'paid' || t.status === 'voided');
      })
    ).subscribe({
      next: (closed) => {
        this.closedTabs.set(closed);
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
    const tab = this.closedTabs().find(t => t.id === id);
    if (tab) {
      this.router.navigate(['/tabs/receipt', tab.id]);
    }
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }
}