import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersApiService } from '@serveiq/shared/data-access';
import { Supplier, CreateSupplierRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  private suppliersApi = inject(SuppliersApiService);

  suppliers = signal<Supplier[]>([]);
  isLoading = signal(true);

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  editingSupplier = signal<Supplier | null>(null);

  // Form data
  formName = signal('');
  formContact = signal('');
  formPhone = signal('');
  formEmail = signal('');
  formAddress = signal('');
  formNote = signal('');
  formError = signal('');
  formSubmitting = signal(false);

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.isLoading.set(true);
    this.suppliersApi.list().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load suppliers' });
      }
    });
  }

  // Modal controls
  openCreateModal() {
    this.formName.set('');
    this.formContact.set('');
    this.formPhone.set('');
    this.formEmail.set('');
    this.formAddress.set('');
    this.formNote.set('');
    this.formError.set('');
    this.showCreateModal.set(true);
  }

  openEditModal(supplier: Supplier) {
    this.editingSupplier.set(supplier);
    this.formName.set(supplier.name);
    this.formContact.set(supplier.contactPerson || '');
    this.formPhone.set(supplier.phone || '');
    this.formEmail.set(supplier.email || '');
    this.formAddress.set(supplier.address || '');
    this.formNote.set(supplier.note || '');
    this.formError.set('');
    this.showEditModal.set(true);
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.editingSupplier.set(null);
  }

  saveSupplier() {
    if (!this.formName()) {
      this.formError.set('Name is required');
      return;
    }
    this.formSubmitting.set(true);
    this.formError.set('');

    const payload: CreateSupplierRequest = {
      name: this.formName(),
      contactPerson: this.formContact() || undefined,
      phone: this.formPhone() || undefined,
      email: this.formEmail() || undefined,
      address: this.formAddress() || undefined,
      note: this.formNote() || undefined,
    };

    const request = this.editingSupplier()
      ? this.suppliersApi.update(this.editingSupplier()!.id, payload)
      : this.suppliersApi.create(payload);

    request.subscribe({
      next: (saved) => {
        this.formSubmitting.set(false);
        if (this.editingSupplier()) {
          this.suppliers.update(list => list.map(s => s.id === saved.id ? saved : s));
        } else {
          this.suppliers.update(list => [...list, saved]);
        }
        this.closeModals();
        this.saveSwal(this.editingSupplier() ? 'Supplier Updated' : 'Supplier Created');
      },
      error: (err) => {
        this.formSubmitting.set(false);
        const status = err.status;
        if (status === 422 && err.error?.errors) {
          const fieldErrors = Object.values(err.error.errors).flat().join('; ');
          this.formError.set(fieldErrors || 'Validation error');
        } else if (status === 400 && err.error?.message) {
          this.formError.set(err.error.message);
        } else {
          Swal.fire({ icon: 'error', title: 'Failed to save', text: err.error?.message || 'Please try again.' });
        }
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    Swal.fire({
      title: 'Delete Supplier',
      text: `Are you sure you want to delete ${supplier.name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',

    }).then((result) => {
      if (result.isConfirmed) {
        this.suppliersApi.removeById(supplier.id).subscribe({
          next: () => {
            this.suppliers.set(this.suppliers().filter(s => s.id !== supplier.id));
            Swal.fire({ icon: 'success', title: 'Supplier Deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' })
        });
      }
    });
  }

  saveSwal(title: string) {
    Swal.fire({ icon: 'success', title, timer: 1500, showConfirmButton: false });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(n => !!n)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}