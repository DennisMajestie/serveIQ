import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Table, Tab } from '@serveiq/shared/models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '@serveiq/shared/data-access';

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
  private authService = inject(AuthService);

  branchName = 'Main Dining Room';
  isSynced = signal(false);
  isLoading = signal(true);

  tables = signal<Table[]>([]);
  openTabs = signal<Tab[]>([]);

  stats = computed(() => {
    const t = this.tables();
    if (!Array.isArray(t)) return { totalTables: 0, available: 0, occupied: 0 };
    return {
      totalTables: t.length,
      available: t.filter(x => x.status === 'available').length,
      occupied: t.filter(x => x.status === 'occupied').length
    };
  });

  get currentUserId(): string {
    const token = this.authService.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || '';
    } catch {
      return '';
    }
  }

  getTabForTable(tableId: string): Tab | undefined {
    return this.openTabs().find(t => t.tableId === tableId);
  }

  isTabLockedByOther(table: Table): boolean {
    const tab = this.getTabForTable(table.id);
    return tab?.status === 'open' && !!tab.waiterId && tab.waiterId !== this.currentUserId;
  }

  private pollSub?: Subscription;

  ngOnInit() {
    this.loadTables();
    this.loadOpenTabs();
    // Poll every 5 seconds for live updates
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.tablesApi.getAllTables())
    ).subscribe(tables => {
      if (Array.isArray(tables)) this.tables.set(tables);
      this.isSynced.set(true);
      this.loadOpenTabs();
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
        this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
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
    // Check if tab is locked by another waiter
    if (this.isTabLockedByOther(table)) {
      console.log('[Tables] Tab is occupied by another waiter');
      return;
    }

    // Ensure we have latest open tabs
    await this.refreshOpenTabs();

    const tab = this.getTabForTable(table.id);
    
    if (!tab) {
      // No open tab - start new order
      await this.router.navigate(['/tabs/create', table.id]);
    } else {
      // Existing open tab - go to detail page
      await this.router.navigate(['/tabs/detail', tab.id]);
    }
  }

  private async refreshOpenTabs(): Promise<void> {
    return new Promise((resolve) => {
      this.tabsApi.getAllTabs().subscribe({
        next: (tabs) => {
          this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  async onSeatTable(table: Table) {
    // Same logic as onTableClick
    await this.onTableClick(table);
  }
}
