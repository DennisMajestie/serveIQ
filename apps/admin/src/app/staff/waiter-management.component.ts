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
  templateUrl: './waiter-management.component.html',
  styleUrls: ['./waiter-management.component.scss']
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
