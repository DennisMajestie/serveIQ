import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TableService } from '../services/table.service';
import { Table } from '../models';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './tables-management.component.html',
  styleUrls: ['./tables-management.component.scss']
})
export class TablesManagementComponent implements OnInit {
  private tableService = inject(TableService);
  isFloorPlan = signal(false);
  isLoading = signal(true);

  readonly tables = signal<Table[]>([]);

  readonly summaryStats = computed(() => {
    const t = this.tables();
    const occupied = t.filter(x => x.status === 'occupied').length;
    const available = t.filter(x => x.status === 'available').length;
    const reserved = t.filter(x => x.status === 'reserved').length;
    const totalSeats = t.reduce((acc, curr) => acc + curr.capacity, 0);
    return [
      { label: 'Available', value: available + ' Tables', icon: 'check_circle', color: 'green' },
      { label: 'Occupied', value: occupied + ' Tables', icon: 'person', color: 'pink' },
      { label: 'Reserved', value: reserved + ' Tables', icon: 'event', color: 'yellow' },
      { label: 'Total Capacity', value: totalSeats + ' Seats', icon: 'group', color: 'brown' }
    ];
  });

  ngOnInit() {
    this.tableService.getTables().subscribe({
      next: (tables) => { this.tables.set(tables); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
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
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: () => ({
        table_number: (document.getElementById('swal-number') as HTMLInputElement).value,
        capacity: (document.getElementById('swal-capacity') as HTMLInputElement).value
      })
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.tableService.createTable({
          table_number: result.value.table_number,
          capacity: Number(result.value.capacity)
        }).subscribe(t => this.tables.update(ts => [...ts, t]));
      }
    });
  }

  editTable(table: Table) {
    Swal.fire({
      title: `Edit Table ${table.table_number}`,
      input: 'number',
      inputLabel: 'Capacity (seats)',
      inputValue: table.capacity,
      confirmButtonColor: '#F97316',
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
      text: `Remove Table ${table.table_number} permanently?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.tableService.updateTableStatus(table.id, 'available').subscribe();
        this.tables.update(ts => ts.filter(t => t.id !== table.id));
      }
    });
  }
}
