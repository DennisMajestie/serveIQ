import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TablesApiService, TabsApiService, UserApiService } from '@serveiq/shared/data-access';
import { Table, Tab, User } from '@serveiq/shared/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './tables-management.component.html',
  styleUrls: ['./tables-management.component.scss']
})
export class TablesManagementComponent implements OnInit {
  private tableService = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private userApi = inject(UserApiService);
  isFloorPlan = signal(false);
  isLoading = signal(true);

  readonly tables = signal<Table[]>([]);
  readonly activeTabs = signal<Map<string, Tab>>(new Map());
  readonly waiterMap = signal<Record<string, string>>({});
  readonly waitersList = signal<User[]>([]);
  statusFilter = signal<string>('all');

  readonly summaryStats = computed(() => {
    const t = this.tables();
    if (!Array.isArray(t)) {
      return [
        { label: 'Available', value: '0 Tables', icon: 'check_circle', color: 'green' },
        { label: 'Occupied', value: '0 Tables', icon: 'person', color: 'pink' },
        { label: 'Reserved', value: '0 Tables', icon: 'event', color: 'yellow' },
        { label: 'Total Capacity', value: '0 Seats', icon: 'group', color: 'brown' }
      ];
    }
    const occupied = t.filter(x => x.status === 'occupied').length;
    const available = t.filter(x => x.status === 'available').length;
    const reserved = t.filter(x => x.status === 'reserved').length;
    const totalSeats = t.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    return [
      { label: 'Available', value: available + ' Tables', icon: 'check_circle', color: 'green' },
      { label: 'Occupied', value: occupied + ' Tables', icon: 'person', color: 'pink' },
      { label: 'Reserved', value: reserved + ' Tables', icon: 'event', color: 'yellow' },
      { label: 'Total Capacity', value: totalSeats + ' Seats', icon: 'group', color: 'brown' }
    ];
  });

  filteredTables = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.tables();
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
      tabs: this.tabsApi.getAllTabs({ all: 'true' }).pipe(catchError(() => of([]))),
      waiters: this.userApi.listWaiters().pipe(catchError(() => of([]))),
    }).subscribe(({ tables, tabs, waiters }) => {
      this.tables.set(Array.isArray(tables) ? tables : []);

      const wm: Record<string, string> = {};
      (waiters as User[]).forEach(w => { wm[w.id] = w.fullName; });
      this.waiterMap.set(wm);
      this.waitersList.set(waiters as User[]);

      const tabMap = new Map<string, Tab>();
      const openTabs = (tabs as Tab[]).filter(t => t.status === 'open' || t.status === 'billed');
      openTabs.forEach(t => tabMap.set(t.tableId, t));
      this.activeTabs.set(tabMap);

      this.isLoading.set(false);
    });
  }

  toggleView() { this.isFloorPlan.update(v => !v); }
  getStatusLabel(status: string) { return status.toUpperCase(); }

  addNewTable() {
    Swal.fire({
      title: 'Add New Table',
      html: `<input id="swal-number" class="swal2-input" placeholder="Table number" type="number">
             <input id="swal-capacity" class="swal2-input" placeholder="Capacity (seats)" type="number">`,
      confirmButtonText: 'Create',
      showCancelButton: true,
      preConfirm: () => ({
        tableNumber: (document.getElementById('swal-number') as HTMLInputElement).value,
        capacity: (document.getElementById('swal-capacity') as HTMLInputElement).value
      })
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const branchId = localStorage.getItem('branchId') || localStorage.getItem('businessId') || 'default-branch';
        this.tableService.createTable({
          tableNumber: result.value.tableNumber,
          capacity: Number(result.value.capacity),
          branchId
        }).subscribe(t => this.tables.update(ts => [...ts, t]));
      }
    });
  }

  editTable(table: Table) {
    Swal.fire({
      title: `Edit Table ${table.tableNumber}`,
      input: 'number',
      inputLabel: 'Capacity (seats)',
      inputValue: table.capacity,
      showCancelButton: true
    }).then(result => {
      if (result.isConfirmed) {
        this.tableService.updateTable(table.id, { capacity: Number(result.value) })
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

  tableEfficiency = computed(() => {
    const t = this.tables();
    if (!t.length) return 92;
    return (t.reduce((s, _, i) => s + (40 + (i * 7) % 55), 0) / t.length);
  });

  recentActivity = computed(() => {
    return this.tables().slice(0, 3);
  });

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'available': return 'bg-[#4be277]/10 text-[#4be277]';
      case 'occupied': return 'bg-[#adc6ff]/10 text-[#adc6ff]';
      case 'reserved': return 'bg-[#ffb4ab]/10 text-[#ffb4ab]';
      default: return 'bg-[#adc6ff]/10 text-[#adc6ff]';
    }
  }
}
