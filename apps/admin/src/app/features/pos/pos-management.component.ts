import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosApiService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

interface PosTerminal {
  id: string;
  label: string;
  isActive: boolean;
}

@Component({
  selector: 'app-pos-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-management.component.html',
  styleUrls: ['./pos-management.component.scss'],
})
export class PosManagementComponent implements OnInit {
  private posApi = inject(PosApiService);

  isLoading = signal(true);
  terminals = signal<PosTerminal[]>([]);
  showModal = signal(false);
  editingTerminal = signal<PosTerminal | null>(null);
  formLabel = signal('');
  formActive = signal(true);

  ngOnInit() { this.loadTerminals(); }

  loadTerminals() {
    this.isLoading.set(true);
    this.posApi.getAll().subscribe({
      next: data => {
        this.terminals.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load Terminals' });
      }
    });
  }

  openAddModal() {
    this.editingTerminal.set(null);
    this.formLabel.set('');
    this.formActive.set(true);
    this.showModal.set(true);
  }

  editTerminal(t: PosTerminal) {
    this.editingTerminal.set(t);
    this.formLabel.set(t.label);
    this.formActive.set(t.isActive);
    this.showModal.set(true);
  }

  saveTerminal() {
    const body = { label: this.formLabel(), is_active: this.formActive() };
    const obs = this.editingTerminal()
      ? this.posApi.update(this.editingTerminal()!.id, body)
      : this.posApi.create(body);
    obs.subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadTerminals();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Save Failed' })
    });
  }

  deleteTerminal(id: string) {
    Swal.fire({
      title: 'Delete POS Terminal?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.posApi.remove(id).subscribe({
          next: () => this.loadTerminals(),
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' })
        });
      }
    });
  }
}
