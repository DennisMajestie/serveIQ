import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService, AuthService, ShiftsApiService } from '@serveiq/shared/data-access';
import { Table, Tab, Shift } from '@serveiq/shared/models';
import { interval, Subscription, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-legacy-tables',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class LegacyTablesComponent implements OnInit, OnDestroy {
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private shiftsApi = inject(ShiftsApiService);

  branchName = 'Main Dining Room';
  isSynced = signal(false);
  isLoading = signal(true);
  toastMessage = signal<string | null>(null);
  currentShift = signal<Shift | null>(null);
  hasOpenShift = computed(() => !!(this.currentShift() && this.currentShift()!.status === 'open'));

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

  private pollSub?: Subscription;
  private tabsSub?: Subscription;

  ngOnInit() {
    this.loadTables();
    this.loadOpenTabs();
    this.loadCurrentShift();
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.tablesApi.getAllTables())
    ).subscribe(tables => {
      this.tables.set(tables);
      this.isSynced.set(true);
      this.loadOpenTabs();
      this.loadCurrentShift();
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
    this.tabsSub?.unsubscribe();
    this.tabsSub = this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
      },
      error: () => {}
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
    let tab = this.openTabs().find(t => t.tableId === table.id);

    if (!tab && table.status === 'occupied') {
      try {
        const allTabs = await firstValueFrom(this.tabsApi.getAllTabs());
        const allOpen = Array.isArray(allTabs) ? allTabs.filter(t => t.status === 'open') : [];
        this.openTabs.set(allOpen);
        tab = allOpen.find(t => t.tableId === table.id);
      } catch {
      }
    }

    if (!tab) {
      if (table.status === 'occupied') {
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
      if (!this.hasOpenShift()) {
        Swal.fire({
          icon: 'warning',
          title: 'No Shift Open',
          text: 'No shift is currently open — ask a manager to open one before seating tables.',
        });
        return;
      }
      await this.router.navigate(['/tabs/create', table.id]);
    } else {
      try {
        await firstValueFrom(this.tabsApi.getTab(tab.id));
        await this.router.navigate(['/tabs/detail', tab.id]);
      } catch (err: any) {
        const httpStatus = err.status ?? err.statusCode;
        if (httpStatus === 403) {
          const msg = err.error?.message || err.message || 'This table is being served by another waiter';
          Swal.fire({ icon: 'info', title: 'Not Available', text: msg, timer: 2500, showConfirmButton: false });
        } else {
          await this.router.navigate(['/tabs/detail', tab.id]);
        }
      }
    }
  }

  getWaiterName(tableId: string): string | null {
    const tab = this.openTabs().find(t => t.tableId === tableId);
    if (!tab) return null;
    return ((tab as any).waiter?.fullName) || null;
  }

  isTabLockedByOther(table: Table): boolean {
    const tab = this.openTabs().find(t => t.tableId === table.id);
    if (!tab) return false;
    return tab.status === 'open' && !!tab.waiterId && tab.waiterId !== this.currentUserId;
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 5000);
  }

  loadCurrentShift(): void {
    this.shiftsApi.getCurrent().subscribe({
      next: (shift) => this.currentShift.set(shift),
      error: () => this.currentShift.set(null),
    });
  }

  async onSeatTable(table: Table) {
    await this.onTableClick(table);
  }
}
