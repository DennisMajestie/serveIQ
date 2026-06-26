import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Table, Tab, OpenTabRequest } from '@serveiq/shared/models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

function getBranchId(): string | null {
  return localStorage.getItem('branchId');
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit, OnDestroy {
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private router = inject(Router);

  branchName = 'Main Dining Room';
  isSynced = signal(false);
  isLoading = signal(true);

  tables = signal<Table[]>([]);
  openTabs = signal<Tab[]>([]);

  stats = computed(() => {
    const t = this.tables();
    return {
      totalTables: t.length,
      available: t.filter(x => x.status === 'available').length,
      occupied: t.filter(x => x.status === 'occupied').length
    };
  });

  private pollSub?: Subscription;

  ngOnInit() {
    this.loadTables();
    this.loadOpenTabs();
    // Poll every 5 seconds for live updates
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.tablesApi.getAllTables())
    ).subscribe(tables => {
      this.tables.set(tables);
      this.isSynced.set(true);
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  loadTables() {
    this.tablesApi.getAllTables().subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.isLoading.set(false);
        this.isSynced.set(true);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadOpenTabs() {
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        this.openTabs.set(tabs.filter(t => t.status === 'open'));
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'occupied': return '#EF4444';
      case 'available': return '#22C55E';
      case 'reserved': return '#EAB308';
      default: return '#94a3b8';
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  async onTableClick(table: Table) {
    if (table.status === 'available') {
      // Prompt for party size then open a new tab
      const { value: partySize } = await Swal.fire({
        title: 'Open New Tab',
        text: `How many guests for Table ${table.tableNumber}?`,
        input: 'number',
        inputAttributes: { min: '1', max: '20', step: '1' },
        inputValue: 1,
        showCancelButton: true,
        confirmButtonText: 'Open Tab',
        inputValidator: (value: string) => {
          if (!value || +value < 1) return 'Party size must be at least 1';
          return undefined;
        }
      });
      if (!partySize) return;

      const request: OpenTabRequest = {
        tableId: table.id,
        partySize: +partySize,
        branchId: getBranchId() || undefined
      };

      try {
        const newTab = await this.tabsApi.createTab(request).toPromise();
        if (newTab?.id) {
          await this.router.navigate(['/tabs/detail', newTab.id]);
        }
      } catch (err) {
        console.error('Failed to open tab:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to open tab' });
      }
    } else {
      // Navigate to existing tab
      const openTab = this.openTabs().find(t => t.tableId === table.id);
      if (openTab) {
        await this.router.navigate(['/tabs/detail', openTab.id]);
      } else {
        // Fallback: create tab if somehow no open tab found
        const { value: partySize } = await Swal.fire({
          title: 'Open New Tab',
          text: `How many guests for Table ${table.tableNumber}?`,
          input: 'number',
          inputAttributes: { min: '1', max: '20', step: '1' },
          inputValue: 1,
          showCancelButton: true,
          confirmButtonText: 'Open Tab',
        });
        if (!partySize) return;
        const request: OpenTabRequest = { tableId: table.id, partySize: +partySize, branchId: getBranchId() || undefined };
        try {
          const newTab = await this.tabsApi.createTab(request).toPromise();
          if (newTab?.id) {
            await this.router.navigate(['/tabs/detail', newTab.id]);
          }
        } catch (err) {
          console.error('Failed to open tab:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to open tab' });
        }
      }
    }
  }

  async onSeatTable(table: Table) {
    // Same logic as onTableClick
    await this.onTableClick(table);
  }
}
