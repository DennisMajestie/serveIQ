import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentsApiService } from '@serveiq/shared/data-access';
import { Department } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Departments</h1>
        <button class="btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">add</span>
          New Department
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-shimmer">
          <div class="shimmer-row"></div>
          <div class="shimmer-row"></div>
          <div class="shimmer-row"></div>
        </div>
      } @else if (departments().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">category</span>
          <h3>No Departments Yet</h3>
          <p>Create departments like Kitchen, Bar, Grill to assign orders during approval.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (dept of departments(); track dept.id) {
                <tr>
                  <td class="cell-name">{{ dept.name }}</td>
                  <td>
                    <span class="status-badge" [class.active]="dept.isActive !== false" [class.inactive]="dept.isActive === false">
                      {{ dept.isActive === false ? 'Inactive' : 'Active' }}
                    </span>
                  </td>
                  <td class="cell-date">{{ dept.createdAt | date:'mediumDate' }}</td>
                  <td class="cell-actions">
                    <button class="btn-icon" (click)="openEditModal(dept)" title="Edit">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon btn-danger-icon" (click)="deleteDepartment(dept)" title="Delete">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingDepartment() ? 'Edit Department' : 'New Department' }}</h2>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            @if (formError()) {
              <div class="form-error">{{ formError() }}</div>
            }
            <div class="form-group">
              <label>Department Name</label>
              <input
                type="text"
                [(ngModel)]="formName"
                (keydown.enter)="saveDepartment()"
                placeholder="e.g. Kitchen, Bar, Grill"
                class="form-input"
                autofocus
              />
            </div>
            @if (editingDepartment()) {
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formIsActive" />
                  Active
                </label>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveDepartment()" [disabled]="formSubmitting()">
              {{ formSubmitting() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { padding: 24px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-secondary { padding: 10px 20px; border: 1px solid #333; border-radius: 10px; background: transparent; color: #ccc; font-size: 14px; cursor: pointer; }
    .btn-icon { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 6px; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .btn-danger-icon:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
    .loading-shimmer { display: flex; flex-direction: column; gap: 12px; }
    .shimmer-row { height: 48px; border-radius: 8px; background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 60px 16px; color: #666; }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { margin: 0 0 8px; color: #999; }
    .empty-state p { margin: 0; font-size: 14px; }
    .table-wrap { border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a; }
    .data-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #222; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }
    .cell-name { font-weight: 500; color: #e0e0e0; }
    .cell-date { color: #888; font-size: 13px; }
    .cell-actions { display: flex; gap: 4px; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .status-badge.active { background: rgba(76,175,80,0.15); color: #81c784; }
    .status-badge.inactive { background: rgba(158,158,158,0.15); color: #bdbdbd; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: #1a1a1a; border-radius: 16px; width: 420px; max-width: 90vw; border: 1px solid #2a2a2a; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h2 { margin: 0; font-size: 18px; }
    .btn-close { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; }
    .modal-body { padding: 20px 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #888; margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #333; background: #111; color: #e0e0e0; font-size: 14px; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: #f97316; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #e0e0e0; cursor: pointer; }
    .checkbox-label input { width: 16px; height: 16px; }
    .form-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  `]
})
export class DepartmentsComponent implements OnInit {
  private departmentsApi = inject(DepartmentsApiService);

  departments = signal<Department[]>([]);
  isLoading = signal(true);

  showModal = signal(false);
  editingDepartment = signal<Department | null>(null);
  formName = '';
  formIsActive = true;
  formError = signal('');
  formSubmitting = signal(false);

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.isLoading.set(true);
    const branchId = localStorage.getItem('branchId') || undefined;
    this.departmentsApi.getAll(true, branchId).subscribe({
      next: (data) => {
        this.departments.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load departments' });
      }
    });
  }

  openCreateModal() {
    this.formName = '';
    this.formIsActive = true;
    this.formError.set('');
    this.editingDepartment.set(null);
    this.showModal.set(true);
  }

  openEditModal(dept: Department) {
    this.formName = dept.name;
    this.formIsActive = dept.isActive !== false;
    this.formError.set('');
    this.editingDepartment.set(dept);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingDepartment.set(null);
  }

  saveDepartment() {
    const name = this.formName.trim();
    if (!name) {
      this.formError.set('Department name is required');
      return;
    }
    this.formSubmitting.set(true);
    this.formError.set('');

    if (this.editingDepartment()) {
      const id = this.editingDepartment()!.id;
      this.departmentsApi.update(id, { name, is_active: this.formIsActive }).subscribe({
        next: (updated) => {
          this.formSubmitting.set(false);
          this.departments.update(list => list.map(d => d.id === updated.id ? updated : d));
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Department Updated', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.formError.set(err.error?.message || 'Failed to update department');
        }
      });
    } else {
      this.departmentsApi.create(name).subscribe({
        next: (saved) => {
          this.formSubmitting.set(false);
          this.departments.update(list => [...list, saved]);
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Department Created', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.formError.set(err.error?.message || 'Failed to create department');
        }
      });
    }
  }

  deleteDepartment(dept: Department) {
    Swal.fire({
      title: 'Delete Department',
      text: `Are you sure you want to delete "${dept.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        this.departmentsApi.remove(dept.id).subscribe({
          next: () => {
            this.departments.set(this.departments().filter(d => d.id !== dept.id));
            Swal.fire({ icon: 'success', title: 'Department Deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' })
        });
      }
    });
  }
}
