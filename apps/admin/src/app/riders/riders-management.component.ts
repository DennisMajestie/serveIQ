import { Component, signal, computed, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RidersApiService,
  CreateRiderRequest,
  BranchesApiService,
} from '@serveiq/shared/data-access';
import { Branch, Rider } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-riders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './riders-management.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./riders-management.component.scss'],
})
export class RidersManagementComponent implements OnInit {
  private ridersApi = inject(RidersApiService);
  private branchesApi = inject(BranchesApiService);

  riders = signal<Rider[]>([]);
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  // Add rider modal
  showAddModal = signal(false);
  isSubmitting = signal(false);
  formFullName = signal('');
  formEmail = signal('');
  formPassword = signal('');
  formPhone = signal('');
  formVehicle = signal('');
  formBranchId = signal('');

  filteredRiders = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const data = this.riders();
    if (!Array.isArray(data)) return [];
    return q
      ? data.filter(r => {
          const name = (r.fullName || '').toLowerCase();
          const email = (r.email || '').toLowerCase();
          return name.includes(q) || email.includes(q);
        })
      : data;
  });

  onlineCount = computed(() => this.riders().filter(r => r.isOnline && r.isActive).length);

  ngOnInit() {
    this.branchesApi.list().subscribe(b => this.branches.set(Array.isArray(b) ? b : []));
    this.loadRiders();
  }

  private loadRiders() {
    this.isLoading.set(true);
    const branchId = localStorage.getItem('branchId') || localStorage.getItem('activeBranchId') || '';
    this.ridersApi.list(branchId && branchId !== 'undefined' ? branchId : undefined).subscribe({
      next: (riders) => {
        this.riders.set(Array.isArray(riders) ? riders : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openAddModal() {
    this.formFullName.set('');
    this.formEmail.set('');
    this.formPassword.set('');
    this.formPhone.set('');
    this.formVehicle.set('');
    this.formBranchId.set(
      this.branches()[0]?.id || localStorage.getItem('branchId') || '',
    );
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  submitRider() {
    const fullName = this.formFullName().trim();
    const email = this.formEmail().trim();
    const password = this.formPassword();
    const branchId = this.formBranchId();
    if (!fullName || !email || !password || !branchId) {
      Swal.fire({ icon: 'error', title: 'Missing Details', text: 'Full name, email, password and branch are required.' });
      return;
    }
    this.isSubmitting.set(true);
    const payload: CreateRiderRequest = {
      fullName,
      email,
      password,
      branchId,
    };
    if (this.formPhone().trim()) payload.phone = this.formPhone().trim();
    if (this.formVehicle().trim()) payload.vehicle = this.formVehicle().trim();

    this.ridersApi.create(payload).subscribe({
      next: (rider) => {
        this.isSubmitting.set(false);
        this.showAddModal.set(false);
        this.loadRiders();
        const esc = (s: string) =>
          s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);
        Swal.fire({
          icon: 'success',
          title: 'Rider Created',
          html: `${esc(rider.fullName || fullName)} can now log in to the Deliveries board with:<br><strong>${esc(email)}</strong><br><small>and the password you set.</small>`,
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.serverMessage || err?.error?.message || 'Failed to create rider';
        Swal.fire({ icon: 'error', title: 'Create Failed', text: msg });
      },
    });
  }

  toggleOnline(rider: Rider) {
    const next = !rider.isOnline;
    this.ridersApi.update(rider.id, { isOnline: next }).subscribe({
      next: () => this.loadRiders(),
      error: (err) => {
        const msg = err?.serverMessage || err?.error?.message || 'Could not update rider';
        Swal.fire({ icon: 'error', title: 'Update Failed', text: msg });
      },
    });
  }

  editRider(rider: Rider) {
    Swal.fire({
      title: `Edit ${rider.fullName || 'Rider'}`,
      html: `
        <div style="text-align:left">
          <label>Vehicle</label>
          <input id="swal-vehicle" class="swal2-input" value="${this.esc(rider.vehicle || '')}" placeholder="e.g. Motorcycle, Bicycle...">
          <label>Branch</label>
          <select id="swal-branch" class="swal2-select">
            ${this.branches()
              .map(b => `<option value="${b.id}" ${b.id === rider.branchId ? 'selected' : ''}>${this.esc(b.name)}</option>`)
              .join('')}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save',
      preConfirm: () => {
        const vehicle = (document.getElementById('swal-vehicle') as HTMLInputElement)?.value?.trim() ?? null;
        const branch = (document.getElementById('swal-branch') as HTMLSelectElement)?.value;
        return { vehicle, branchId: branch };
      },
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      this.ridersApi.update(rider.id, { vehicle: result.value.vehicle || undefined, branchId: result.value.branchId }).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Rider Updated', timer: 1500, showConfirmButton: false });
          this.loadRiders();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Update Failed' }),
      });
    });
  }

  toggleActive(rider: Rider) {
    const activating = !rider.isActive;
    Swal.fire({
      title: activating ? 'Activate rider?' : 'Deactivate rider?',
      text: activating
        ? `${rider.fullName || 'This rider'} will regain access to the deliveries board.`
        : `${rider.fullName || 'This rider'} will be logged out immediately and lose access.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activating ? 'Activate' : 'Deactivate',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.ridersApi.update(rider.id, { isActive: activating }).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: `Rider ${activating ? 'Activated' : 'Deactivated'}`, timer: 1500, showConfirmButton: false });
          this.loadRiders();
        },
        error: (err) => {
          const msg = err?.serverMessage || err?.error?.message || 'Could not update rider';
          Swal.fire({ icon: 'error', title: 'Update Failed', text: msg });
        },
      });
    });
  }

  deleteRider(rider: Rider) {
    Swal.fire({
      title: 'Delete Rider?',
      text: `Permanently remove ${rider.fullName || 'this rider'}? Their account will be deactivated.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.ridersApi.remove(rider.id).subscribe({
        next: () => {
          this.riders.update(rs => rs.filter(r => r.id !== rider.id));
          Swal.fire({ icon: 'success', title: 'Rider Removed', timer: 2000, showConfirmButton: false });
        },
        error: (err) => {
          const msg = err?.serverMessage || err?.error?.message || 'Failed to delete rider';
          Swal.fire({ icon: 'error', title: 'Delete Failed', text: msg });
        },
      });
    });
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.split(' ').filter(n => !!n).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  branchName(branchId: string): string {
    return this.branches().find(b => b.id === branchId)?.name || '—';
  }

  private esc(s: string): string {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}