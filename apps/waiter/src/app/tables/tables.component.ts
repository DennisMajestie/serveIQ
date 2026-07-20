import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService, UserApiService, AuthService, BusinessApiService, ShiftsApiService, NotificationsApiService } from '@serveiq/shared/data-access';
import { Table, Tab, User, Business, Shift, Notification } from '@serveiq/shared/models';
import { forkJoin, interval, Subscription } from 'rxjs';
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
  private userApi = inject(UserApiService);
  private businessApi = inject(BusinessApiService);
  private shiftsApi = inject(ShiftsApiService);
  private notificationsApi = inject(NotificationsApiService);

  branchName = signal('');
  isSynced = signal(false);
  isLoading = signal(true);
  isDataReady = signal(false);
  toastMessage = signal<string | null>(null);
  currentShift = signal<Shift | null>(null);
  hasOpenShift = computed(() => !!(this.currentShift() && this.currentShift()!.status === 'open'));

  tables = signal<Table[]>([]);
  openTabs = signal<Tab[]>([]);
  currentUser = signal<User | null>(null);
  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  stats = computed(() => {
    const t = this.tables();
    if (!Array.isArray(t)) return { totalTables: 0, available: 0, occupied: 0 };
    return {
      totalTables: t.length,
      available: t.filter(x => x.status === 'available').length,
      occupied: t.filter(x => x.status === 'occupied').length
    };
  });

  vipTables = computed(() => this.tables().filter(t => t.isVip));

  vipOccupied = computed(() => {
    return this.vipTables().filter(t => {
      const tab = this.getTabForTable(t.id);
      return !!tab && tab.status === 'open';
    }).length;
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

  get currentUserRole(): string {
    const token = this.authService.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch {
      return '';
    }
  }

  isOwnerOrManager = computed(() => {
    const role = this.currentUserRole;
    return role === 'owner' || role === 'manager';
  });

  getTabForTable(tableId: string): Tab | undefined {
    return this.openTabs().find(t => {
      if (t.tableId === tableId) return true;
      const tableObj = (t as any).table;
      if (tableObj?.id === tableId) return true;
      return false;
    });
  }

  isTabLockedByOther(table: Table): boolean {
    const tab = this.getTabForTable(table.id);
    if (!tab) {
      return false;
    }
    return tab.status === 'open' && !!tab.waiterId && tab.waiterId !== this.currentUserId;
  }

  getWaiterName(tableId: string): string | null {
    const tab = this.getTabForTable(tableId);
    if (!tab) return null;
    return ((tab as any).waiter?.fullName) || null;
  }

  private pollSub?: Subscription;
  private tabsSub?: Subscription;
  private seenOrderReadyIds = new Set<string>();

  ngOnInit() {
    forkJoin({
      tables: this.tablesApi.getAllTables(),
      tabs: this.tabsApi.getAllTabs({ status: 'open' }),
    }).subscribe({
      next: (result) => {
        this.tables.set(Array.isArray(result.tables) ? result.tables : []);
        this.openTabs.set(Array.isArray(result.tabs) ? result.tabs : []);
        this.isDataReady.set(true);
        this.isSynced.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isDataReady.set(true);
      },
    });
    this.loadCurrentUser();
    this.loadBusiness();
    this.loadCurrentShift();
    this.loadNotifications();
    this.pollSub = interval(30000).subscribe(async () => {
      try {
        const tables = await firstValueFrom(this.tablesApi.getAllTables());
        if (Array.isArray(tables)) this.tables.set(tables);
        this.isSynced.set(true);
        this.refreshOpenTabs();
      } catch {}
      this.loadCurrentShift();
      this.loadNotifications();
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
        this.isSynced.set(true);
      },
      error: () => {},
    });
  }

  loadOpenTabs() {
    this.tabsSub?.unsubscribe();
    this.tabsSub = this.tabsApi.getAllTabs({ status: 'open' }).subscribe({
      next: (tabs) => {
        this.openTabs.set(Array.isArray(tabs) ? tabs : []);
      },
      error: () => {}  // poll will retry; errors are non-critical
    });
  }

  loadCurrentUser(): void {
    this.userApi.getMe().subscribe({
      next: (user) => this.currentUser.set(user),
    });
  }

  loadBusiness(): void {
    const cached = localStorage.getItem('businessName');
    if (cached) { this.branchName.set(cached); return; }
    this.businessApi.getBusiness().subscribe({
      next: (biz) => {
        const name = biz?.name || '';
        if (name) {
          this.branchName.set(name);
          localStorage.setItem('businessName', name);
        }
      },
    });
  }

  loadCurrentShift(): void {
    const branchId = localStorage.getItem('branchId') || undefined;
    this.shiftsApi.getCurrent(branchId).subscribe({
      next: (shift) => this.currentShift.set(shift),
      error: (err) => {
        console.error('getCurrent shift failed', err);
        this.shiftsApi.list().subscribe({
          next: (shifts) => {
            const open = (Array.isArray(shifts) ? shifts : []).find(s => s.status === 'open');
            this.currentShift.set(open || null);
          },
          error: (err2) => {
            console.error('list shifts fallback also failed', err2);
            this.currentShift.set(null);
          },
        });
      },
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

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 5000);
  }

  async releaseTable(table: Table, event: Event) {
    event.stopPropagation();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Release Table?',
      text: `Force-release "${table.label || table.tableNumber}"? Any open tab will be voided and stock restored.`,
      showCancelButton: true,
      confirmButtonText: 'Release',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await firstValueFrom(this.tablesApi.releaseTable(table.id));
      this.showToast(`Table "${table.label || table.tableNumber}" released`);
      this.loadTables();
      this.loadOpenTabs();
    } catch (err: any) {
      const msg = err.error?.message || 'Failed to release table';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  }

  async onTableClick(table: Table) {
    if (!this.isDataReady()) {
      Swal.fire({ icon: 'info', title: 'Loading', text: 'Please wait…', timer: 1000, showConfirmButton: false });
      return;
    }
    let tab = this.getTabForTable(table.id);

    if (!tab && table.status === 'occupied') {
      try {
        const allTabs = await firstValueFrom(this.tabsApi.getAllTabs({ status: 'open' }));
        this.openTabs.set(Array.isArray(allTabs) ? allTabs : []);
        tab = (Array.isArray(allTabs) ? allTabs : []).find(t => {
          if (t.tableId === table.id) return true;
          const tableObj = (t as any).table;
          return tableObj?.id === table.id;
        });
      } catch {
        // Fallback — continue with null tab
      }
    }

    if (!tab) {
      if (table.status === 'occupied') {
        console.warn('[TableMismatch] table=%s occupied but no matching tab found. openTabs=%o', table.id, this.openTabs().map(t => ({ id: t.id, tableId: t.tableId, table: (t as any).table, status: t.status })));
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
      // Pre-flight: verify waiter ownership against backend (source of truth)
      try {
        await firstValueFrom(this.tabsApi.getTab(tab.id));
        await this.router.navigate(['/tabs/detail', tab.id]);
      } catch (err: any) {
        const httpStatus = err.status ?? err.statusCode;
        if (httpStatus === 403) {
          const msg = err.error?.message || err.message || 'This table is being served by another waiter';
          this.showToast(msg);
        } else {
          // Non-auth error — still try to navigate; detail component handles its own errors
          await this.router.navigate(['/tabs/detail', tab.id]);
        }
      }
    }
  }

  loadNotifications() {
    this.notificationsApi.list().subscribe({
      next: (notifications) => {
        const list = Array.isArray(notifications) ? notifications : [];
        this.notifications.set(list);

        const orderReady = list.filter((n: Notification) => !n.isRead && (n.type as any) === 'order_ready' && !this.seenOrderReadyIds.has(n.id));
        orderReady.forEach((n: Notification) => {
          this.seenOrderReadyIds.add(n.id);
          Swal.fire({
            icon: 'success',
            title: 'Order Ready',
            text: n.message || 'Your order is ready for pickup.',
            timer: 3000,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff'
          });
          this.notificationsApi.markRead(n.id).subscribe({ error: () => {} });
        });
      },
      error: () => {}
    });
  }

  openNotifications() {
    this.router.navigate(['/notifications']);
  }

  private async refreshOpenTabs(): Promise<boolean> {
    // Cancel the stale subscribe-based load so it doesn't overwrite our fresh data
    this.tabsSub?.unsubscribe();
    try {
      const tabs = await firstValueFrom(this.tabsApi.getAllTabs({ status: 'open' }));
      this.openTabs.set(Array.isArray(tabs) ? tabs : []);
      return true;
    } catch {
      return false;
    }
  }

  async onSeatTable(table: Table) {
    await this.onTableClick(table);
  }
}
