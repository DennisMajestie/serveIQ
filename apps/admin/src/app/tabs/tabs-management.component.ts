import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TabsApiService } from '@serveiq/shared/data-access';
import { Tab } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { CurrencyContextService } from '../core/currency-context.service';

@Component({
  selector: 'app-tabs-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tabs-management.component.html',
  styleUrls: ['./tabs-management.component.scss']
})
export class TabsManagementComponent implements OnInit {
  private tabsApi = inject(TabsApiService);
  private router = inject(Router);
  private currency = inject(CurrencyContextService);

  tabs = signal<Tab[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  filteredTabs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.tabs();
    if (!q) return all;
    return all.filter(t =>
      t.id.toLowerCase().includes(q) ||
      (t.customerName && t.customerName.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.loadTabs();
  }

  loadTabs() {
    this.isLoading.set(true);
    this.tabsApi.getAll().subscribe({
      next: (data) => {
        this.tabs.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load tabs' });
      }
    });
  }

  viewTab(tab: Tab) {
    this.router.navigate(['/tabs/detail', tab.id]);
  }

  getTableLabel(tab: any): string {
    return tab.table?.tableNumber || tab.table?.label || tab.tableId.slice(0, 8);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'billed': return 'status-billed';
      case 'paid': return 'status-paid';
      case 'voided': return 'status-voided';
      default: return '';
    }
  }

  formatKobo(kobo: number): string {
    if (!kobo) return this.currency.formatKobo(0);
    return this.currency.formatKobo(kobo);
  }

  getTotalKobo(tab: Tab): number {
    return (tab as any).totalKobo || 0;
  }

  trackById(_index: number, tab: Tab) {
    return tab.id;
  }
}
