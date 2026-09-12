import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { TablesApiService, TabsApiService, UserApiService, ReservationsApiService } from '@serveiq/shared/data-access';
import { Table, Tab, User, Reservation } from '@serveiq/shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './tables-management.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./tables-management.component.scss']
})
export class TablesManagementComponent implements OnInit, OnDestroy {
  private tableService = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private userApi = inject(UserApiService);
  private reservationsApi = inject(ReservationsApiService);
  private router = inject(Router);
  isFloorPlan = signal(false);
  isLoading = signal(true);

  readonly tables = signal<Table[]>([]);
  readonly activeTabs = signal<Map<string, Tab>>(new Map());
  readonly waiterMap = signal<Record<string, string>>({});
  readonly waitersList = signal<User[]>([]);
  statusFilter = signal<string>('all');

  readonly activeReservations = signal<Reservation[]>([]);
  nowTick = signal(Date.now());

  /** Minutes before the booking time the table starts showing as reserved. */
  readonly reservationHoldMinutes = 15;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly reservedByTableId = computed<Map<string, Reservation>>(() => {
    const now = this.nowTick();
    const holdMs = this.reservationHoldMinutes * 60 * 1000;
    const map = new Map<string, Reservation>();
    for (const r of this.activeReservations()) {
      if (r.status !== 'pending' && r.status !== 'confirmed') continue;
      if (!r.tableId) continue;
      const start = new Date(r.reservationTime).getTime();
      if (Number.isNaN(start)) continue;
      const end = start + (r.durationMinutes || 90) * 60 * 1000;
      if (now >= start - holdMs && now <= end) {
        map.set(r.tableId, r);
      }
    }
    return map;
  });

  isReservedNow(table: Table): boolean {
    return !!this.reservedByTableId().get(table.id);
  }

  reservationForTable(table: Table): Reservation | null {
    return this.reservedByTableId().get(table.id) || null;
  }

  /** Effective status shown on the floor plan: derived 'reserved' overrides available. */
  displayStatus(table: Table): string {
    if (table.status === 'available' && this.isReservedNow(table)) return 'reserved';
    return table.status;
  }

  formatReservationTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  private loadReservations() {
    const branchId = localStorage.getItem('branchId') || undefined;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    this.reservationsApi.list({ branchId, from: from.toISOString(), to: to.toISOString(), limit: 100 })
      .pipe(catchError(() => of([])))
      .subscribe((res) => this.activeReservations.set(Array.isArray(res) ? res : []));
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  readonly summaryStats = computed(() => {
    const t = this.tables();
    if (!Array.isArray(t)) {
      return [
        { label: 'Available', value: '0 Tables', icon: 'check_circle', color: 'green' },
        { label: 'Occupied', value: '0 Tables', icon: 'person', color: 'pink' },
        { label: 'Reserved', value: '0 Tables', icon: 'event', color: 'yellow' },
        { label: 'Out of Service', value: '0 Tables', icon: 'do_not_disturb_on', color: 'grey' },
        { label: 'VIP', value: '0 Tables', icon: 'workspace_premium', color: 'amber' },
        { label: 'Total Capacity', value: '0 Seats', icon: 'group', color: 'brown' }
      ];
    }
    const occupied = t.filter(x => x.status === 'occupied').length;
    const available = t.filter(x => x.status === 'available' && !this.isReservedNow(x)).length;
    const reserved = t.filter(x => this.displayStatus(x) === 'reserved').length;
    const inactive = t.filter(x => x.status === 'inactive').length;
    const vip = t.filter(x => x.isVip).length;
    const totalSeats = t.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    return [
      { label: 'Available', value: available + ' Tables', icon: 'check_circle', color: 'green' },
      { label: 'Occupied', value: occupied + ' Tables', icon: 'person', color: 'pink' },
      { label: 'Reserved', value: reserved + ' Tables', icon: 'event', color: 'yellow' },
      { label: 'Out of Service', value: inactive + ' Tables', icon: 'do_not_disturb_on', color: 'grey' },
      { label: 'VIP', value: vip + ' Tables', icon: 'workspace_premium', color: 'amber' },
      { label: 'Total Capacity', value: totalSeats + ' Seats', icon: 'group', color: 'brown' }
    ];
  });

  filteredTables = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.tables();
    if (f === 'vip') return this.tables().filter(t => t.isVip);
    if (f === 'reserved') return this.tables().filter(t => this.displayStatus(t) === 'reserved');
    if (f === 'available') return this.tables().filter(t => t.status === 'available' && !this.isReservedNow(t));
    return this.tables().filter(t => t.status === f);
  });

  getWaiterForTable(tableId: string): string {
    const tab = this.activeTabs().get(tableId);
    if (!tab?.waiterId) return '';
    return this.waiterMap()[tab.waiterId] || '';
  }

  ngOnInit() {
    forkJoin({
      tables: this.tableService.getAllTables().pipe(catchError(() => of([]))),
      tabs: this.tabsApi.getAllTabs({ status: 'open' }).pipe(catchError(() => of([]))),
      waiters: this.userApi.listWaiters().pipe(catchError(() => of([]))),
    }).subscribe(({ tables, tabs, waiters }) => {
      this.tables.set((Array.isArray(tables) ? tables : []).filter(t => !t.isVirtual));

      const wm: Record<string, string> = {};
      (waiters as User[]).forEach(w => { wm[w.id] = w.fullName; });
      this.waiterMap.set(wm);
      this.waitersList.set(waiters as User[]);

      const tabMap = new Map<string, Tab>();
      const openTabs = (tabs as Tab[]).filter(t => t.status === 'open');
      openTabs.forEach(t => tabMap.set(t.tableId, t));
      this.activeTabs.set(tabMap);

      this.isLoading.set(false);
    });
    this.loadReservations();
    this.refreshTimer = setInterval(() => {
      this.nowTick.set(Date.now());
      this.loadReservations();
    }, 60 * 1000);
  }

  toggleView() { this.isFloorPlan.update(v => !v); }
  getStatusLabel(status: string) { return status.toUpperCase(); }

  openTable(table: Table) {
    if (table.status === 'occupied') {
      this.router.navigate(['/app/tables', table.id]);
      return;
    }
    this.editTable(table);
  }

  addNewTable() {
    Swal.fire({
      title: 'Add New Table',
      html: `<input id="swal-number" class="swal2-input" placeholder="Table number" type="number">
             <input id="swal-capacity" class="swal2-input" placeholder="Capacity (seats)" type="number">
             <label class="swal2-checkbox-label" style="display:flex;align-items:center;gap:8px;margin-top:12px;justify-content:center;font-size:14px">
               <input id="swal-vip" type="checkbox"> VIP Table
             </label>`,
      confirmButtonText: 'Create',
      showCancelButton: true,
      preConfirm: () => ({
        tableNumber: (document.getElementById('swal-number') as HTMLInputElement).value,
        capacity: (document.getElementById('swal-capacity') as HTMLInputElement).value,
        isVip: (document.getElementById('swal-vip') as HTMLInputElement).checked
      })
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const branchId = localStorage.getItem('branchId') || localStorage.getItem('businessId') || '';
        if (!branchId || branchId === 'undefined') {
          Swal.fire({ icon: 'error', title: 'No Branch Found', text: 'Create a branch in Business Setup or Settings first.' });
          return;
        }
        this.tableService.createTable({
          tableNumber: result.value.tableNumber,
          capacity: Number(result.value.capacity),
          branchId,
          isVip: result.value.isVip
        }).subscribe(t => this.tables.update(ts => [...ts, t]));
      }
    });
  }

  editTable(table: Table) {
    Swal.fire({
      title: `Edit Table ${table.tableNumber}`,
      html: `<input id="swal-edit-capacity" class="swal2-input" placeholder="Capacity (seats)" type="number" value="${table.capacity}">
             <label class="swal2-checkbox-label" style="display:flex;align-items:center;gap:8px;margin-top:12px;justify-content:center;font-size:14px">
               <input id="swal-edit-vip" type="checkbox"${table.isVip ? ' checked' : ''}> VIP Table
             </label>`,
      showCancelButton: true,
      preConfirm: () => ({
        capacity: Number((document.getElementById('swal-edit-capacity') as HTMLInputElement).value),
        isVip: (document.getElementById('swal-edit-vip') as HTMLInputElement).checked
      })
    }).then(result => {
      if (result.isConfirmed) {
        this.tableService.updateTable(table.id, { capacity: result.value.capacity, isVip: result.value.isVip })
          .subscribe(updated => this.tables.update(ts => ts.map(t => t.id === updated.id ? updated : t)));
      }
    });
  }

  updateTableStatus(table: Table, newStatus: 'available' | 'occupied' | 'reserved') {
    const originalStatus = table.status;
    table.status = newStatus;
    this.tables.set([...this.tables()]);

    this.tableService.updateTableStatus(table.id, newStatus).subscribe({
      error: () => {
        table.status = originalStatus;
        this.tables.set([...this.tables()]);
      }
    });
  }

  deleteTable(table: Table) {
    Swal.fire({
      title: 'Delete Table?',
      text: `Remove Table ${table.tableNumber} permanently?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then(result => {
      if (result.isConfirmed) {
        this.tableService.deleteTable(table.id).subscribe({
          next: () => this.tables.update(ts => ts.filter(t => t.id !== table.id)),
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed', text: 'Could not delete table.' })
        });
      }
    });
  }

  totalEfficiency = computed(() => {
    const t = this.tables();
    if (!t.length) return 0;
    const occupied = t.filter(x => x.status === 'occupied').length;
    return Math.min(100, Math.round((occupied / t.length) * 85 + 15));
  });

  activeCovers = computed(() => {
    return this.tables().filter(t => t.status === 'occupied').reduce((s, t) => s + (t.capacity || 0), 0);
  });

  totalCovers = computed(() => {
    return this.tables().reduce((s, t) => s + (t.capacity || 0), 0);
  });

  estimatedWaitTime = computed(() => {
    const occupied = this.tables().filter(t => t.status === 'occupied').length;
    if (occupied === 0) return 0;
    return Math.max(5, Math.round(occupied * 3.5));
  });

  recentActivity = computed(() => {
    return this.tables().slice(0, 3);
  });

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'available': return 'bg-[#4be277]/10 text-[#4be277]';
      case 'occupied': return 'bg-[#adc6ff]/10 text-[#adc6ff]';
      case 'reserved': return 'bg-[#ffb4ab]/10 text-[#ffb4ab]';
      case 'inactive': return 'bg-[#8d99ae]/10 text-[#8d99ae]';
      default: return 'bg-[#adc6ff]/10 text-[#adc6ff]';
    }
  }
}
