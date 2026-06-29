import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftsApiService } from '@serveiq/shared/data-access';
import { Shift, OpenShiftRequest, CloseShiftRequest } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {
  private shiftsApi = inject(ShiftsApiService);

  shifts = signal<Shift[]>([]);
  currentShift = signal<Shift | null>(null);
  isLoading = signal(true);

  // Modal states for opening/closing shifts
  showOpenModal = signal(false);
  showCloseModal = signal(false);
  isSaving = signal(false);

  // Form data for shift operations
  startingCash = signal<number>(0);
  closeCash = signal<number>(0);
  closeNote = signal('');

  ngOnInit() {
    this.loadShifts();
    this.loadCurrentShift();
  }

  loadShifts() {
    this.shiftsApi.list().subscribe({
      next: (data) => {
        this.shifts.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load shifts', confirmButtonColor: '#F97316' });
      }
    });
  }

  loadCurrentShift() {
    this.shiftsApi.getCurrent().subscribe({
      next: (shift) => {
        this.currentShift.set(shift);
      },
      error: () => { this.currentShift.set(null); }
    });
  }

  openShift() {
    if (this.startingCash() <= 0) {
      Swal.fire({ icon: 'error', title: 'Starting cash must be greater than 0', confirmButtonColor: '#F97316' });
      return;
    }

    this.isSaving.set(true);
    const payload: OpenShiftRequest = {
      startingCashKobo: this.startingCash(),
      note: ''
    };

    this.shiftsApi.open(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showOpenModal.set(false);
        this.startingCash.set(0);
        this.loadShifts();
        this.loadCurrentShift();
        Swal.fire({ icon: 'success', title: 'Shift Opened', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to open shift', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  closeShift(shift: Shift) {
    if (this.closeCash() <= 0) {
      Swal.fire({ icon: 'error', title: 'Actual cash must be greater than 0', confirmButtonColor: '#F97316' });
      return;
    }

    if (this.closeCash() < (shift.expectedCashKobo || 0)) {
      Swal.fire({
        icon: 'warning',
        title: 'Cash variance detected!',
        text: `Expected: ${(shift.expectedCashKobo || 0) / 100} | Actual: ${this.closeCash() / 100}. Continue?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, close shift',
        confirmButtonColor: '#F97316',
        cancelButtonColor: '#6b7280'
      }).then((result) => {
        if (result.isConfirmed) {
          this.performCloseShift(shift);
        }
      });
      return;
    }

    this.performCloseShift(shift);
  }

  performCloseShift(shift: Shift) {
    this.isSaving.set(true);
    const payload: CloseShiftRequest = {
      actualCashKobo: this.closeCash(),
      note: this.closeNote() || ''
    };

    this.shiftsApi.close(shift.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showCloseModal.set(false);
        this.closeCash.set(0);
        this.closeNote.set('');
        this.loadShifts();
        this.loadCurrentShift();
        const variance = this.closeCash() - (shift.expectedCashKobo || 0);
        if (variance !== 0) {
          Swal.fire({
            icon: 'info',
            title: 'Shift Closed with Variance',
            text: `Variance: ${variance > 0 ? '+' : ''}${(variance / 100).toFixed(2)}`,
            timer: 3000,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff'
          });
        } else {
          Swal.fire({ icon: 'success', title: 'Shift Closed', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
        }
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to close shift', background: '#1e293b', color: '#fff', confirmButtonColor: '#F97316' });
      }
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getShiftStatusColor(status: string): string {
    switch (status) {
      case 'open': return '#22c55e';
      case 'closed': return '#94a3b8';
      default: return '#94a3b8';
    }
  }
}