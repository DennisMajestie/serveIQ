import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TablesApiService } from '@serveiq/shared/data-access';
import { Table } from '@serveiq/shared/models';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="table-management">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs inter-font" aria-label="Breadcrumb">
        <span class="breadcrumb-item">Admin</span>
        <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
        <span class="breadcrumb-item active">Table Management</span>
      </nav>

      <header class="header">
        <div class="header-content">
          <h1 class="page-title space-font">Table Management</h1>
          <p class="page-subtitle inter-font">Real-time floor status & occupancy</p>
        </div>
        
        <div class="header-actions">
          <button class="toggle-btn" (click)="toggleView()" [attr.aria-pressed]="isFloorPlan()">
            <mat-icon>{{ isFloorPlan() ? 'grid_view' : 'map' }}</mat-icon>
            <span>{{ isFloorPlan() ? 'Grid View' : 'Floor Plan' }}</span>
          </button>
          <button class="primary-btn inter-font" (click)="addNewTable()">
            <mat-icon>add</mat-icon>
            <span>Add Table</span>
          </button>
        </div>
      </header>

      <!-- KPI Stats Row -->
      <section class="stats-bar" aria-label="Summary statistics">
        <div class="stat" *ngFor="let stat of summaryStats()">
          <div class="stat-bubble" [class]="stat.color">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label inter-font">{{ stat.label }}</span>
            <span class="stat-value space-font">{{ stat.value }}</span>
          </div>
        </div>
      </section>

      <!-- Table Grid -->
      <main class="bento-grid" [class.floor-plan]="isFloorPlan()" role="list" aria-label="Tables">
        <!-- Add New Table (Ghost Card) -->
        <article class="table-card ghost-card" (click)="addNewTable()" role="button" aria-label="Add new table">
          <div class="card-inner">
            <div class="add-btn-circle">
              <mat-icon>add</mat-icon>
            </div>
            <span class="ghost-label inter-font">Add New Table</span>
          </div>
        </article>

        <!-- Table Cards -->
        <article class="table-card" *ngFor="let table of tables()" 
                 role="listitem" 
                 [class]="'status-' + table.status"
                 [routerLink]="['/tables', table.id]"
                 style="cursor: pointer;">
          <div class="card-inner">
            <div class="table-header">
              <div class="table-number-group" [class]="table.status">
                <span class="table-prefix inter-font">T</span>
                <span class="table-number space-font">{{ table.tableNumber }}</span>
              </div>
              <span class="status-tag inter-font"
                     [ngClass]="{
                       'tag--available': table.status === 'available',
                       'tag--occupied': table.status === 'occupied',
                       'tag--reserved': table.status === 'reserved'
                     }">
                {{ getStatusLabel(table.status) }}
              </span>
            </div>
            
            <div class="table-info">
              <div class="seats-group">
                <mat-icon>group</mat-icon>
                <span class="seats-count inter-font">{{ table.capacity }} Seats</span>
              </div>
              <span class="zone-label inter-font">{{ table.label || 'Main Dining' }}</span>
            </div>
            
            <div class="table-footer">
              <div class="card-actions">
                <button class="card-link inter-font" (click)="editTable(table); $event.stopPropagation()">
                  <mat-icon>edit_note</mat-icon>
                  <span>Edit</span>
                </button>
                <button class="card-link inter-font delete" (click)="deleteTable(table); $event.stopPropagation()">
                  <mat-icon>delete_outline</mat-icon>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
          <div class="card-glow"></div>
        </article>

        <!-- Quick Tip Card -->
        <article class="table-card tip-card">
          <div class="card-inner">
            <h3 class="tip-title inter-font">Quick Tip</h3>
            <p class="tip-text inter-font">
              Dragging tables into groups automatically creates temporary merged table IDs for large parties.
            </p>
            <a class="learn-more inter-font" href="#">
              <span>Learn More</span>
              <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </article>
      </main>
    </div>
  `,
  styles: [`
    .table-management {
      padding: 32px 40px;
      background: var(--surface);
    }

    .breadcrumbs {
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
      color: var(--on-surface-muted); font-size: 0.8125rem; font-weight: 500;
      .breadcrumb-item.active { color: var(--on-surface); font-weight: 600; }
      .breadcrumb-separator { font-size: 16px; width: 16px; height: 16px; }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--on-surface);
      margin: 0;
      line-height: 1.1;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--on-surface-muted);
      margin: 8px 0 0;
    }

    .header-actions { display: flex; align-items: center; gap: 16px; }

    .toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: white;
      border: 1px solid var(--surface-container);
      border-radius: 12px;
      font-weight: 600;
      color: var(--on-surface);
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: var(--surface-low); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--on-surface-muted); }
    }

    .primary-btn {
      background: var(--primary); color: white; border: none;
      padding: 12px 24px; border-radius: 12px; font-weight: 600;
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      transition: transform 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px var(--primary-glow); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 48px;
    }
    
    .stat {
      background: white;
      border-radius: 24px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 32px rgba(11, 28, 48, 0.03);
    }

    .stat-bubble {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      &.green { background: #e7f9ed; color: #22C55E; }
      &.pink { background: #fff1f2; color: #F43F5E; }
      &.yellow { background: #fefce8; color: #EAB308; }
      &.brown { background: #fdf5f1; color: #9A3412; }
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }

    .stat-content { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: 0.875rem; font-weight: 500; color: var(--on-surface-muted); }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--on-surface); line-height: 1.2; }

    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 32px;
    }

    .table-card {
      position: relative;
      background: white;
      border-radius: 24px;
      box-shadow: 0 12px 48px rgba(11, 28, 48, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { transform: translateY(-4px); box-shadow: 0 24px 64px rgba(11, 28, 48, 0.08); }
    }

    .ghost-card {
      border: 2px dashed #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
      &:hover { border-color: var(--primary); background: #fff7ed; }
      .card-inner { justify-content: center; align-items: center; padding-top: 48px; padding-bottom: 48px; }
      .add-btn-circle {
        width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e2e8f0;
        display: flex; align-items: center; justify-content: center; color: #94a3b8;
        margin-bottom: 12px;
      }
      .ghost-label { font-weight: 600; color: #94a3b8; font-size: 0.9375rem; }
    }

    .tip-card {
      background: #f8fbff; border: 1px solid #eef2ff;
      .tip-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin: 0 0 12px; font-weight: 500; }
      .tip-text { color: #64748b; line-height: 1.6; font-size: 0.9375rem; font-style: italic; margin-bottom: 24px; }
      .learn-more {
        display: flex; align-items: center; gap: 6px; text-decoration: none;
        color: var(--primary); font-weight: 700; font-size: 0.875rem;
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .card-inner { padding: 28px; display: flex; flex-direction: column; gap: 24px; }

    .table-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .table-number-group {
      width: 48px; height: 48px; border-radius: 50%; border: 2px solid #f1f5f9;
      display: flex; align-items: center; justify-content: center; gap: 1px;
      &.available { border-color: #22C55E; .table-prefix { color: #22C55E; } }
      &.occupied { border-color: #F43F5E; .table-prefix { color: #F43F5E; } }
      &.reserved { border-color: #EAB308; .table-prefix { color: #EAB308; } }
    }
    .table-prefix { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-top: 2px; }
    .table-number { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    
    .status-tag {
      padding: 6px 16px; border-radius: 100px; font-size: 0.6875rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em;
      &.tag--available { background: #e7f9ed; color: #166534; }
      &.tag--occupied { background: #fff1f2; color: #991b1b; }
      &.tag--reserved { background: #fefce8; color: #854d0e; }
    }

    .table-info { display: flex; flex-direction: column; gap: 8px; }
    .seats-group {
      display: flex; align-items: center; gap: 8px; color: #334155;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
      .seats-count { font-weight: 700; font-size: 0.9375rem; }
    }
    .zone-label { font-size: 0.8125rem; color: #94a3b8; font-weight: 500; }

    .table-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 20px; border-top: 1px solid #f1f5f9;
    }

    .card-actions { display: flex; gap: 20px; }
    .card-link {
      background: transparent; border: none; padding: 0; color: #64748b;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: color 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: var(--primary); }
      &.delete:hover { color: #EF4444; }
    }

    .card-glow {
      position: absolute; inset: 0; pointer-events: none; opacity: 0;
      transition: opacity 0.3s;
      background: radial-gradient(circle at 100% 0%, var(--primary-glow) 0%, transparent 60%);
    }
    .table-card:hover .card-glow { opacity: 1; }

    @media (max-width: 1600px) { .bento-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } .stats-bar { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class TablesManagementComponent implements OnInit {
  private tablesApi = inject(TablesApiService);
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
    this.tablesApi.getAllTables().subscribe({
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
        tableNumber: (document.getElementById('swal-number') as HTMLInputElement).value,
        capacity: (document.getElementById('swal-capacity') as HTMLInputElement).value
      })
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.tablesApi.getAllTables().subscribe(tables => {
          const branchId = tables[0]?.branchId;
          if (!branchId) return;
          this.tablesApi.createTable({
            branchId,
            tableNumber: result.value.tableNumber,
            capacity: Number(result.value.capacity)
          }).subscribe(t => this.tables.update(ts => [...ts, t]));
        });
      }
    });
  }

  editTable(table: Table) {
    Swal.fire({
      title: `Edit Table ${table.tableNumber}`,
      input: 'number',
      inputLabel: 'Capacity (seats)',
      inputValue: table.capacity,
      confirmButtonColor: '#F97316',
      showCancelButton: true
    }).then(result => {
      if (result.isConfirmed) {
        this.tablesApi.updateTable(table.id, { capacity: Number(result.value) })
          .subscribe(updated => this.tables.update(ts => ts.map(t => t.id === updated.id ? updated : t)));
      }
    });
  }

  deleteTable(table: Table) {
    Swal.fire({
      title: 'Delete Table?',
      text: `Remove Table ${table.tableNumber} permanently?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.tablesApi.updateTable(table.id, { status: 'available' }).subscribe();
        this.tables.update(ts => ts.filter(t => t.id !== table.id));
      }
    });
  }
}
