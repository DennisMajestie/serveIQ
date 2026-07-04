import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService, TablesApiService } from '@serveiq/shared/data-access';
import { Tab } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

interface Transaction {
  id: string;
  table: string;
  customer: string;
  status: string;
  statusIcon: string;
  amount: number;
  method: string;
}

@Component({
  selector: 'app-tab-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-history.component.html',
  styleUrls: ['./tab-history.component.scss']
})
export class TabHistoryComponent implements OnInit {
  private router = inject(Router);
  private tabsApi = inject(TabsApiService);
  private tablesApi = inject(TablesApiService);

  isLoading = signal(true);
  closedTabs = signal<Tab[]>([]);

  currentDate = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric' });

  tableNumbers = signal<Record<string, string>>({});

  transactions = computed<Transaction[]>(() => {
    const tabs = this.closedTabs();
    const tableNums = this.tableNumbers();
    if (!Array.isArray(tabs)) return [];
    return tabs.map(t => ({
      id: t.id,
      table: t.tableId ? (tableNums[t.tableId] || t.tableId.slice(0, 8)) : '—',
      customer: t.customerName ?? 'Walk-in',
      status: t.status === 'paid' ? 'Paid' : t.status === 'voided' ? 'Voided' : t.status,
      statusIcon: t.status === 'paid' ? 'check_circle' : t.status === 'voided' ? 'cancel' : 'help',
      amount: (t as any).totalKobo ?? 0,
      method: (t as any).paymentMethod ?? 'Cash'
    }));
  });

  transactionsCount = computed(() => this.transactions().length);

  shiftTotal = computed(() => {
    const txns = this.transactions();
    return Array.isArray(txns) ? txns.reduce((sum, t) => sum + t.amount, 0) / 100 : 0;
  });

  ngOnInit() {
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        const arr = Array.isArray(tabs) ? tabs : [];
        this.closedTabs.set(arr.filter(t => t.status === 'paid' || t.status === 'voided'));
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
    this.tablesApi.getAllTables().subscribe({
      next: (tables) => {
        const map: Record<string, string> = {};
        (Array.isArray(tables) ? tables : []).forEach(t => {
          if (t.id) map[t.id] = `Table ${t.tableNumber}`;
        });
        this.tableNumbers.set(map);
      }
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  getStatusLabel(tab: Tab): string {
    return tab.status === 'paid' ? 'Paid' : tab.status === 'voided' ? 'Voided' : tab.status;
  }

  openTransaction(tab: Tab) {
    this.router.navigate(['/tabs/receipt', tab.id]);
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