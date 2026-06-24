import { __decorate } from "tslib";
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { UserApiService, UploadApiService } from "../../../../../libs/shared/data-access/src/index.ts";
import Swal from 'sweetalert2';
let WaiterManagementComponent = class WaiterManagementComponent {
    staffService = inject(UserApiService);
    uploadService = inject(UploadApiService);
    searchQuery = signal('');
    waiters = signal([]);
    isLoading = signal(true);
    // Add Waiter Modal state
    showAddModal = signal(false);
    isSubmitting = signal(false);
    avatarPreview = signal(null);
    selectedFile = signal(null);
    formFullName = signal('');
    formEmail = signal('');
    formPhone = signal('');
    filteredWaiters = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        const data = this.waiters();
        if (!Array.isArray(data))
            return [];
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
                const mapped = w.map(item => ({
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
        this.resetWaiterForm();
        this.showAddModal.set(true);
    }
    closeModal() { this.showAddModal.set(false); }
    onAvatarSelected(event) {
        const file = event.target.files?.[0];
        if (!file)
            return;
        this.selectedFile.set(file);
        const reader = new FileReader();
        reader.onload = (e) => this.avatarPreview.set(e.target?.result);
        reader.readAsDataURL(file);
    }
    async submitWaiter() {
        const fullName = this.formFullName().trim();
        if (!fullName)
            return;
        this.isSubmitting.set(true);
        let avatarUrl;
        if (this.selectedFile()) {
            try {
                const uploaded = await this.uploadService.uploadFile(this.selectedFile()).toPromise();
                avatarUrl = uploaded?.url;
            }
            catch { /* silently skip photo */ }
        }
        const branchId = localStorage.getItem('branchId') || localStorage.getItem('businessId') || 'default-branch';
        const payload = {
            fullName,
            email: this.formEmail().trim(),
            phone: this.formPhone().trim(),
            branchId,
            ...(avatarUrl ? { avatarUrl } : {})
        };
        this.staffService.createWaiter(payload).subscribe({
            next: (w) => {
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
    resetWaiterForm() {
        this.formFullName.set('');
        this.formEmail.set('');
        this.formPhone.set('');
        this.avatarPreview.set(null);
        this.selectedFile.set(null);
    }
    resetPin(id) {
        Swal.fire({
            title: 'Reset PIN',
            text: `Reset PIN for this waiter? A new PIN will be generated and displayed.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F97316',
            confirmButtonText: 'Reset PIN'
        }).then(result => {
            if (result.isConfirmed) {
                this.staffService.resetStaffPin(id, '1234').subscribe({
                    next: (response) => {
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
    deleteWaiter(id) {
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
    onSearch() { }
    toggleFilters() { }
    toggleStatus(waiter) { }
    clearFilters() { this.searchQuery.set(''); }
    trackById(index, w) { return w.id; }
    getInitials(name) {
        if (!name)
            return '?';
        return name.split(' ').filter(n => !!n).map(n => n[0]).join('').toUpperCase();
    }
    roleFilterLabel = computed(() => 'All Waiters');
};
WaiterManagementComponent = __decorate([
    Component({
        selector: 'app-waiter-management',
        standalone: true,
        imports: [CommonModule, FormsModule],
        templateUrl: './waiter-management.component.html',
        styleUrls: ['./waiter-management.component.scss']
    })
], WaiterManagementComponent);
export { WaiterManagementComponent };
//# sourceMappingURL=waiter-management.component.js.map