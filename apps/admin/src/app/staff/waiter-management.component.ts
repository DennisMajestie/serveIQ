import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { UserApiService, UploadApiService, User, Waiter } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-waiter-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './waiter-management.component.html',
  styleUrls: ['./waiter-management.component.scss']
})
export class WaiterManagementComponent implements OnInit {
  private staffService = inject(UserApiService);
  private uploadService = inject(UploadApiService);
  searchQuery = signal('');

  waiters = signal<Waiter[]>([]);
  isLoading = signal(true);

  // Add Waiter Modal state
  showAddModal = signal(false);
  isSubmitting = signal(false);
  avatarPreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  formFullName = signal('');
  formEmail = signal('');
  formPhone = signal('');
  editWaiter = signal<Waiter | null>(null);
  editFullName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  isEditing = signal(false);

  filteredWaiters = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const data = this.waiters();
    if (!Array.isArray(data)) return [];
    return q ? data.filter(w => {
      const name = (w.fullName || '').toLowerCase();
      const email = (w.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }) : data;
  });

  summaryStats = computed(() => {
    const data = this.waiters();
    const count = Array.isArray(data) ? data.length : 0;
    return [
      { label: 'Total Waiters', value: count.toString(), icon: 'users', color: 'orange' },
      { label: 'Active Staff', value: count.toString(), icon: 'check', color: 'blue' },
      { label: 'On Leave', value: '0', icon: 'assignment', color: 'purple' },
      { label: 'Branches', value: '1', icon: 'store', color: 'brown' }
    ];
  });

  ngOnInit() {
    this.staffService.listWaiters().subscribe({
      next: (w) => {
        const arr = Array.isArray(w) ? w : [];
        const mapped = arr.map(item => ({
          ...item,
          fullName: item.fullName || ''
        }));
        this.waiters.set(mapped);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openAddStaffModal() {
    this.resetWaiterForm();
    this.showAddModal.set(true);
  }

  closeModal() { this.showAddModal.set(false); }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async submitWaiter() {
    const fullName = this.formFullName().trim();
    if (!fullName) return;
    this.isSubmitting.set(true);

    let avatarUrl: string | undefined;
    if (this.selectedFile()) {
      try {
        const uploaded = await this.uploadService.uploadFile(this.selectedFile()!).toPromise();
        avatarUrl = uploaded?.url;
      } catch { /* silently skip photo */ }
    }

    const branchId = localStorage.getItem('branchId') || localStorage.getItem('businessId') || 'default-branch';
    const payload: any = {
      fullName,
      email: this.formEmail().trim(),
      phone: this.formPhone().trim(),
      branchId,
      ...(avatarUrl ? { avatarUrl } : {})
    };

    this.staffService.createWaiter(payload).subscribe({
      next: (w: any) => {
        this.waiters.update(ws => [...ws, w]);
        this.isSubmitting.set(false);
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Waiter Created',
          html: `Waiter added successfully!<br><strong style="font-size:22px;letter-spacing:4px">${w.pin}</strong><br><small>Share this PIN with the waiter to log in.</small>`,
          confirmButtonColor: '#F97316'
        });
      },
      error: () => {
        this.isSubmitting.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to create waiter', confirmButtonColor: '#F97316' });
      }
    });
  }

  private resetWaiterForm() {
    this.formFullName.set('');
    this.formEmail.set('');
    this.formPhone.set('');
    this.avatarPreview.set(null);
    this.selectedFile.set(null);
  }

  resetPin(id: string) {
    Swal.fire({
      title: 'Reset PIN',
      text: `Reset PIN for this waiter? A new PIN will be generated and displayed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      confirmButtonText: 'Reset PIN'
    }).then(result => {
      if (result.isConfirmed) {
        this.staffService.resetStaffPin(id, '1234').subscribe({ // Note: backend generates PIN if null or provided
          next: (response: any) => {
            const pin = response?.pin || '1234';
            this.waiters.update(ws => ws.map(w => w.id === id ? { ...w, pin } : w));
            Swal.fire({
              icon: 'success',
              title: 'PIN Reset',
              html: `New PIN generated!<br><strong>${pin}</strong><br><small>Share this PIN with the waiter</small>`,
              timer: 3000,
              showConfirmButton: true
            });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to reset PIN' })
        });
      }
    });
  }

  openEditWaiter(waiter: Waiter) {
    this.editWaiter.set(waiter);
    this.editFullName.set(waiter.fullName || '');
    this.editEmail.set(waiter.email || '');
    this.editPhone.set((waiter as any).phone || '');
  }

  closeEditModal() {
    this.editWaiter.set(null);
  }

  saveEdit() {
    if (!this.editFullName() || !this.editWaiter()) return;
    this.isEditing.set(true);
    this.staffService.updateUser(this.editWaiter()!.id, {
      fullName: this.editFullName(),
      email: this.editEmail(),
    } as any).subscribe({
      next: (updated: any) => {
        this.isEditing.set(false);
        this.waiters.update(ws => ws.map(w => w.id === updated.id ? { ...w, fullName: updated.fullName || this.editFullName(), email: updated.email || this.editEmail() } : w));
        this.closeEditModal();
        Swal.fire({ icon: 'success', title: 'Waiter Updated', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isEditing.set(false);
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  deactivateWaiter(id: string) {
    Swal.fire({
      title: 'Deactivate Waiter',
      text: 'This waiter will lose access to the system. You can re-activate later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Deactivate'
    }).then(result => {
      if (result.isConfirmed) {
        this.staffService.deactivateUser(id).subscribe({
          next: () => {
            this.waiters.update(ws => ws.map(w => w.id === id ? { ...w, isActive: false } : w));
            Swal.fire({ icon: 'success', title: 'Waiter Deactivated', timer: 2000, showConfirmButton: false, background: '#1e293b', color: '#fff' });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' })
        });
      }
    });
  }

  deleteWaiter(id: string) {
    Swal.fire({
      title: 'Delete Waiter',
      text: 'Are you sure you want to remove this waiter?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      confirmButtonText: 'Yes, delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.staffService.deleteWaiter(id).subscribe({
          next: () => {
            this.waiters.update(ws => ws.filter(w => w.id !== id));
            Swal.fire({ icon: 'success', title: 'Waiter removed', timer: 2000, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to delete waiter' })
        });
      }
    });
  }

  onSearch() {}
  toggleFilters() {}
  toggleStatus(waiter: Waiter) {}
  clearFilters() { this.searchQuery.set(''); }
  trackById(index: number, w: Waiter) { return w.id; }
  getInitials(name: string | undefined | null): string { 
    if (!name) return '?';
    return name.split(' ').filter(n => !!n).map(n => n[0]).join('').toUpperCase(); 
  }
  roleFilterLabel = computed(() => 'All Waiters');
}
