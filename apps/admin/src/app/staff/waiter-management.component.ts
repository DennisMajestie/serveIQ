import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { UserApiService } from '@serveiq/shared/data-access';
import { User } from '@serveiq/shared/models';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-waiter-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="staff-management">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Staff Management</h1>
            <p class="page-subtitle">Manage restaurant personnel, roles, and access.</p>
          </div>
          <button class="btn-primary add-staff-btn" (click)="openAddStaffModal()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add Waiter</span>
          </button>
        </div>
      </header>

      <!-- Stats Summary Cards -->
      <section class="stats-grid">
        <article class="stat-card" *ngFor="let stat of summaryStats()">
          <div class="stat-icon" [class]="'stat-icon--' + stat.color">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ng-container [ngSwitch]="stat.icon">
                <path *ngSwitchCase="'users'" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle *ngSwitchCase="'check'" cx="12" cy="12" r="10"/><path *ngSwitchCase="'check'" d="m9 12 2 2 4-4"/>
                <path *ngSwitchCase="'assignment'" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect *ngSwitchCase="'store'" x="2" y="7" width="20" height="15" rx="2" ry="2"/><path *ngSwitchCase="'store'" d="m17 2-1 5H8L7 2Z"/>
              </ng-container>
            </svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </article>
      </section>

      <!-- Data Table Card -->
      <section class="table-card">
        <div class="table-sub-header">
          <div class="filter-controls">
            <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            <span class="filter-label inter-font">Filter by Role:</span>
            <div class="role-dropdown-trigger" (click)="toggleFilters()">
              <span class="current-filter">{{ roleFilterLabel() }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="arrow-icon">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
          <span class="showing-count inter-font">Showing 1-{{ filteredWaiters().length }} of {{ waiters().length }}</span>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">NAME & ID</th>
                <th scope="col">ROLE</th>
                <th scope="col">BRANCH</th>
                <th scope="col">STATUS</th>
                <th scope="col" class="cell-actions-header">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr class="data-row" *ngFor="let waiter of filteredWaiters(); trackBy: trackById">
                <td class="cell-name">
                  <div class="staff-avatar">
                    <span class="avatar-initials">{{ getInitials(waiter.fullName) }}</span>
                  </div>
                  <div class="staff-info">
                    <span class="staff-name">{{ waiter.fullName }}</span>
                    <span class="staff-id">{{ waiter.email }}</span>
                  </div>
                </td>
                <td class="cell-role">
                  <span class="role-pill waiter">WAITER</span>
                </td>
                <td class="cell-branch">
                  <span class="branch-name">Main Branch</span>
                </td>
                <td class="cell-status">
                  <div class="status-toggle-group">
                    <span class="toggle-switch active"><span class="toggle-thumb"></span></span>
                    <span class="status-text">Active</span>
                  </div>
                </td>
                <td class="cell-actions">
                  <button class="action-icon-btn" aria-label="Edit staff">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                  <button class="action-icon-btn" aria-label="Delete staff" (click)="deleteWaiter(waiter.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <footer class="table-pagination">
          <button class="pag-btn prev" [disabled]="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>Previous</span>
          </button>
          <div class="pag-numbers">
            <button class="page-num active">1</button>
            <button class="page-num">2</button>
            <button class="page-num">3</button>
          </div>
          <button class="pag-btn next">
            <span>Next</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </footer>
      </section>

      <footer class="confidential-footer inter-font">
        © 2024 ServeIQ Management Systems. Confidential Administrative View.
      </footer>
    </div>
  `,
  styles: [`
    .staff-management {
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 32px;
      padding: 40px 48px;
      max-width: 1600px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
      color: #0b1c30;
    }

    /* ===== PAGE HEADER ===== */
    .page-header { grid-row: 1; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
    .title-group { display: grid; gap: 8px; }
    .page-title { margin: 0; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2.75rem; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 1.1rem; color: #64748b; }

    /* ===== PRIMARY BUTTON ===== */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px;
      background: var(--primary, #F97316); color: white; border: none; border-radius: 14px;
      font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.2);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3); }
    .btn-icon { width: 20px; height: 20px; }

    /* ===== STATS GRID ===== */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .stat-card {
      display: flex; align-items: center; gap: 20px; padding: 32px;
      background: white; border-radius: 24px; box-shadow: 0 8px 32px rgba(11, 28, 48, 0.03);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(11, 28, 48, 0.08); }
    .stat-icon {
      width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      svg { width: 28px; height: 28px; }
    }
    .stat-icon--orange { background: #fdf5f1; color: #F97316; }
    .stat-icon--blue { background: #f0f7ff; color: #0059bb; }
    .stat-icon--purple { background: #f5f3ff; color: #a855f7; }
    .stat-icon--green { background: #e7f9ed; color: #22c55e; }
    .stat-icon--brown { background: #fdf8f6; color: #78350f; }
    .stat-label { font-size: 1rem; font-weight: 500; color: #64748b; margin: 0 0 4px; }
    .stat-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2rem; margin: 0; line-height: 1; }

    /* ===== TABLE CARD ===== */
    .table-card {
      background: white; border-radius: 24px; box-shadow: 0 12px 48px rgba(11, 28, 48, 0.04);
      overflow: hidden; border: 1px solid #f1f5f9;
    }
    .table-sub-header {
      background: #f8fbff; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .filter-controls { display: flex; align-items: center; gap: 12px; }
    .filter-icon { width: 18px; height: 18px; color: #64748b; }
    .filter-label { font-size: 0.9375rem; color: #64748b; font-weight: 500; }
    .role-dropdown-trigger {
      display: flex; align-items: center; gap: 8px; cursor: pointer; color: #F97316; font-weight: 700;
      .arrow-icon { width: 14px; height: 14px; }
    }
    .showing-count { font-size: 0.875rem; color: #64748b; font-weight: 600; }

    .table-wrapper { padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left; padding: 24px 32px 16px; font-weight: 700; font-size: 0.75rem;
      text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; background: white;
    }
    .data-table td { padding: 20px 32px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .data-row:hover { background: #fcfdfe; }

    /* ===== CELLS ===== */
    .cell-name { display: flex; align-items: center; gap: 16px; min-width: 280px; }
    .avatar-img { width: 48px; height: 48px; border-radius: 16px; object-fit: cover; }
    .staff-avatar { background: #0b1c30; color: white; width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .staff-name { display: block; font-weight: 700; font-size: 1.05rem; color: #1e293b; margin-bottom: 2px; }
    .staff-id { font-size: 0.8125rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.02em; }

    .role-pill {
      display: inline-block; padding: 6px 14px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;
      &.waiter { background: #eff6ff; color: #3b82f6; border: 1.5px solid rgba(59, 130, 246, 0.1); }
      &.manager { background: #fff7ed; color: #F97316; border: 1.5px solid rgba(249, 115, 22, 0.1); }
      &.senior-waiter { background: #f5f3ff; color: #8b5cf6; }
    }
    .branch-name { font-weight: 600; color: #475569; font-size: 1rem; }

    /* ===== TOGGLE SWITCH ===== */
    .status-toggle-group { display: flex; align-items: center; gap: 12px; }
    .toggle-switch {
      width: 44px; height: 24px; background: #e2e8f0; border-radius: 100px; border: none;
      position: relative; cursor: pointer; transition: background 0.3s;
      &.active { background: #92400e; .toggle-thumb { transform: translateX(20px); } }
    }
    .toggle-thumb {
      width: 18px; height: 18px; background: white; border-radius: 50%;
      position: absolute; left: 3px; top: 3px; transition: transform 0.3s;
    }
    .status-text { font-weight: 600; color: #475569; font-size: 0.9375rem; }

    /* ===== ACTIONS ===== */
    .cell-actions { text-align: right; display: flex; justify-content: flex-end; gap: 16px; }
    .cell-actions-header { text-align: right; }
    .action-icon-btn {
      background: transparent; border: none; cursor: pointer; color: #94a3b8;
      transition: color 0.2s; padding: 8px; border-radius: 10px;
      svg { width: 20px; height: 20px; }
      &:hover { color: #F97316; background: #fdf5f1; }
    }

    /* ===== PAGINATION ===== */
    .table-pagination {
      padding: 24px 32px; background: #f8fbff; display: flex; justify-content: space-between; align-items: center;
    }
    .pag-btn {
      display: flex; align-items: center; gap: 8px; background: transparent; border: none;
      color: #64748b; font-weight: 600; cursor: pointer; font-size: 0.9375rem;
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      svg { width: 18px; height: 18px; }
    }
    .pag-numbers { display: flex; gap: 8px; }
    .page-num {
      width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent;
      color: #64748b; font-weight: 700; cursor: pointer;
      &.active { background: #92400e; color: white; }
      &:hover:not(.active) { background: #f1f5f9; }
    }

    .confidential-footer { text-align: center; color: #94a3b8; font-size: 0.8125rem; font-weight: 500; margin-top: 16px; }
  `]
})
export class WaiterManagementComponent implements OnInit {
  private userApi = inject(UserApiService);
  searchQuery = signal('');

  waiters = signal<User[]>([]);
  isLoading = signal(true);

  filteredWaiters = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return q ? this.waiters().filter(w =>
      w.fullName.toLowerCase().includes(q) || w.email.toLowerCase().includes(q)
    ) : this.waiters();
  });

  summaryStats = computed(() => [
    { label: 'Total Waiters', value: this.waiters().length.toString(), icon: 'users', color: 'orange' },
    { label: 'Active Staff', value: this.waiters().length.toString(), icon: 'check', color: 'blue' },
    { label: 'On Leave', value: '0', icon: 'assignment', color: 'purple' },
    { label: 'Branches', value: '1', icon: 'store', color: 'brown' }
  ]);

  ngOnInit() {
    this.userApi.listWaiters().subscribe({
      next: (w) => { this.waiters.set(w); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openAddStaffModal() {
    Swal.fire({
      title: 'Add New Waiter',
      html: `
        <input id="sw-name" class="swal2-input" placeholder="Full Name">
        <input id="sw-email" class="swal2-input" placeholder="Email" type="email">
        <input id="sw-pass" class="swal2-input" placeholder="Password" type="password">
      `,
      confirmButtonText: 'Create Waiter',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: () => ({
        fullName: (document.getElementById('sw-name') as HTMLInputElement).value,
        email: (document.getElementById('sw-email') as HTMLInputElement).value,
        password: (document.getElementById('sw-pass') as HTMLInputElement).value
      })
    }).then(result => {
      if (result.isConfirmed && result.value?.fullName) {
        this.userApi.createWaiter(result.value).subscribe({
          next: (w) => {
            this.waiters.update(ws => [...ws, w]);
            Swal.fire({ icon: 'success', title: 'Waiter Created', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to create waiter' })
        });
      }
    });
  }

  deleteWaiter(id: string) {
    Swal.fire({
      title: 'Remove Waiter?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Delete'
    }).then(r => {
      if (r.isConfirmed) {
        this.userApi.deleteWaiter(id).subscribe(() =>
          this.waiters.update(ws => ws.filter(w => w.id !== id))
        );
      }
    });
  }

  onSearch() {}
  toggleFilters() {}
  toggleStatus(waiter: User) {}
  clearFilters() { this.searchQuery.set(''); }
  trackById(index: number, w: User) { return w.id; }
  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').toUpperCase(); }
  roleFilterLabel = computed(() => 'All Waiters');
}
