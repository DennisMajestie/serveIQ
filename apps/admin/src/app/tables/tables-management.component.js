import { __decorate } from "tslib";
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TablesApiService } from "../../../../../libs/shared/data-access/src/index.ts";
import Swal from 'sweetalert2';
let TablesManagementComponent = class TablesManagementComponent {
    tableService = inject(TablesApiService);
    isFloorPlan = signal(false);
    isLoading = signal(true);
    tables = signal([]);
    summaryStats = computed(() => {
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
    ngOnInit() {
        this.tableService.getAllTables().subscribe({
            next: (tables) => { this.tables.set(tables); this.isLoading.set(false); },
            error: () => this.isLoading.set(false)
        });
    }
    toggleView() { this.isFloorPlan.update(v => !v); }
    getStatusLabel(status) { return status.toUpperCase(); }
    addNewTable() {
        Swal.fire({
            title: 'Add New Table',
            html: `<input id="swal-number" class="swal2-input" placeholder="Table number" type="number">
             <input id="swal-capacity" class="swal2-input" placeholder="Capacity (seats)" type="number">`,
            confirmButtonText: 'Create',
            confirmButtonColor: '#F97316',
            showCancelButton: true,
            preConfirm: () => ({
                tableNumber: document.getElementById('swal-number').value,
                capacity: document.getElementById('swal-capacity').value
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
    editTable(table) {
        Swal.fire({
            title: `Edit Table ${table.tableNumber}`,
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
    updateTableStatus(table, newStatus) {
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
    deleteTable(table) {
        Swal.fire({
            title: 'Delete Table?',
            text: `Remove Table ${table.tableNumber} permanently?`,
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
};
TablesManagementComponent = __decorate([
    Component({
        selector: 'app-table-management',
        standalone: true,
        imports: [CommonModule, MatIconModule, RouterModule],
        templateUrl: './tables-management.component.html',
        styleUrls: ['./tables-management.component.scss']
    })
], TablesManagementComponent);
export { TablesManagementComponent };
//# sourceMappingURL=tables-management.component.js.map