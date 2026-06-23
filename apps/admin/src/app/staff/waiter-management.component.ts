import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { UserApiService, User, Waiter } from '@serveiq/shared/data-access';
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
  searchQuery = signal('');

  waiters = signal<Waiter[]>([]);
  isLoading = signal(true);

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
        const mapped = (w as any[]).map(item => ({
          ...item,
          fullName: item.fullName || item.full_name || ''
        }));
        this.waiters.set(mapped);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openAddStaffModal() {
    Swal.fire({
      title: 'Add New Waiter',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input id="sw-name" class="swal2-input" placeholder="Full Name" style="margin: 0;">
          <input id="sw-email" class="swal2-input" placeholder="Email (Optional)" type="email" style="margin: 0;">
          <input id="sw-phone" class="swal2-input" placeholder="Phone (Optional)" type="tel" style="margin: 0;">
        </div>
      `,
      confirmButtonText: 'Create Waiter',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: () => {
        const fullName = (document.getElementById('sw-name') as HTMLInputElement).value;
        const email = (document.getElementById('sw-email') as HTMLInputElement).value;
        const phone = (document.getElementById('sw-phone') as HTMLInputElement).value;
        
        if (!fullName) {
          Swal.showValidationMessage('Full name is required');
          return null;
        }
        
        const branchId = localStorage.getItem('branchId') || localStorage.getItem('businessId') || 'default-branch';
        return { fullName, email, phone, branchId };
      }
    }).then(result => {
      if (result.isConfirmed && result.value?.fullName) {
        this.staffService.createWaiter(result.value).subscribe({
          next: (w: any) => {
            this.waiters.update(ws => [...ws, w]);
            Swal.fire({
              icon: 'success',
              title: 'Waiter Created',
              html: `New waiter created successfully!<br><strong>PIN: ${w.pin}</strong><br><small>Share this PIN with the waiter</small>`,
              timer: 3000,
              showConfirmButton: true
            });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to create waiter' })
        });
      }
    });
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
