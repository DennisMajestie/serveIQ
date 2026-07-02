import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Table, Tab } from '@serveiq/shared/models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '@serveiq/shared/data-access';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

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
    if (!tab) {
      console.log(`[Tables] isTabLockedByOther: no tab for table ${table.id}`);
      return false;
    }
    console.log(`[Tables] isTabLockedByOther: table=${table.id}, tab.waiterId=${tab.waiterId}, currentUserId=${this.currentUserId}`);
    return tab.status === 'open' && !!tab.waiterId && tab.waiterId !== this.currentUserId;
  }

  private pollSub?: Subscription;
  private tabsSub?: Subscription;

  ngOnInit() {
    this.loadTables();
    this.loadOpenTabs();
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.tablesApi.getAllTables())
    ).subscribe(tables => {
      if (Array.isArray(tables)) this.tables.set(tables);
      this.isSynced.set(true);
      this.refreshOpenTabs();
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.tabsSub?.unsubscribe();
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
    this.tabsSub?.unsubscribe();
    this.tabsSub = this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
      },
      error: (err) => console.error('[Tables] loadOpenTabs error:', err)
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
    console.log(`[Tables] onTableClick: table=${table.id}, status=${table.status}`);

    // Fetch latest open tabs first
    const refreshOk = await this.refreshOpenTabs();
    if (!refreshOk) {
      console.warn('[Tables] refreshOpenTabs failed, using existing data');
    }

    // Check if tab is locked by another waiter (uses fresh data)
    if (this.isTabLockedByOther(table)) {
      console.log('[Tables] Tab is occupied by another waiter');
      return;
    }

    let tab = this.getTabForTable(table.id);
    console.log(`[Tables] getTabForTable result:`, tab?.id ?? 'none');

    // Fallback: table is occupied but no tab found in openTabs — do a direct lookup
    if (!tab && table.status === 'occupied') {
      console.log('[Tables] Table is occupied but no open tab found in list — querying API directly');
      try {
        const allTabs = await firstValueFrom(this.tabsApi.getAllTabs());
        const allOpen = Array.isArray(allTabs) ? allTabs.filter(t => t.status === 'open') : [];
        this.openTabs.set(allOpen);
        tab = allOpen.find(t => t.tableId === table.id);
        if (tab) {
          console.log('[Tables] Found tab via direct lookup:', tab.id);
        } else {
          console.warn('[Tables] Table is occupied but no open tab found even after direct lookup');
        }
      } catch (err) {
        console.error('[Tables] Direct tab lookup failed:', err);
      }
    }

    if (!tab) {
      if (table.status === 'occupied') {
        console.warn('[Tables] Table is occupied but no open tab exists — data mismatch. Refusing to create duplicate.');
        const result = await Swal.fire({
          icon: 'error',
          title: 'Table Mismatch',
          text: 'This table shows as occupied but no active tab was found.',
          showConfirmButton: true,
          showDenyButton: true,
          confirmButtonText: 'Reset Table',
          denyButtonText: 'Refresh',
        });
        if (result.isConfirmed) {
          try {
            await firstValueFrom(this.tablesApi.updateTableStatus(table.id!, 'available' as any));
            this.loadTables();
            this.loadOpenTabs();
          } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to reset table status' });
          }
        } else if (result.isDenied) {
          this.loadTables();
          this.loadOpenTabs();
        }
        return;
      }
      console.log('[Tables] No open tab — navigating to create');
      await this.router.navigate(['/tabs/create', table.id]);
    } else {
      console.log('[Tables] Existing tab found — navigating to detail:', tab.id);
      await this.router.navigate(['/tabs/detail', tab.id]);
    }
  }

  private async refreshOpenTabs(): Promise<boolean> {
    // Cancel the stale subscribe-based load so it doesn't overwrite our fresh data
    this.tabsSub?.unsubscribe();
    try {
      const tabs = await firstValueFrom(this.tabsApi.getAllTabs());
      this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
      console.log(`[Tables] refreshOpenTabs: ${this.openTabs().length} open tabs found`);
      return true;
    } catch (err) {
      console.error('[Tables] Failed to refresh open tabs:', err);
      return false;
    }
  }

  async onSeatTable(table: Table) {
    await this.onTableClick(table);
  }
}
