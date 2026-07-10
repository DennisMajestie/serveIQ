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

  varianceExplanationFor(shift: Shift, actualKoboOverride?: number): string {
    const actualKobo = actualKoboOverride ?? shift.actualCashKobo ?? 0;
    const expectedKobo = shift.expectedCashKobo || 0;
    const startKobo = shift.startingCashKobo;
    const varianceKobo = actualKobo - expectedKobo;
    const fs = this.formatKobo(startKobo);
    const fe = this.formatKobo(expectedKobo);
    const fa = this.formatKobo(actualKobo);
    if (varianceKobo === 0) {
      return `Started with \u20A6${fs}. Expected \u20A6${fe}. Actual matched exactly.`;
    } else if (varianceKobo > 0) {
      return `Started with \u20A6${fs}. Expected \u20A6${fe}. Actual \u20A6${fa} — \u20A6${this.formatKobo(varianceKobo)} over.`;
    } else {
      return `Started with \u20A6${fs}. Expected \u20A6${fe}. Actual \u20A6${fa} — \u20A6${this.formatKobo(Math.abs(varianceKobo))} short.`;
    }
  }

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
        Swal.fire({ icon: 'error', title: 'Failed to load shifts' });
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
    const cashNaira = this.startingCash();
    if (cashNaira <= 0) {
      Swal.fire({ icon: 'error', title: 'Starting cash must be greater than 0' });
      return;
    }

    this.isSaving.set(true);
    const payload: OpenShiftRequest = {
      starting_cash_kobo: Math.round(cashNaira * 100),
      note: ''
    };

    this.shiftsApi.open(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showOpenModal.set(false);
        this.startingCash.set(0);
        this.loadShifts();
        this.loadCurrentShift();
        Swal.fire({ icon: 'success', title: 'Shift Opened', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to open shift' });
      }
    });
  }

  closeShift(shift: Shift) {
    const actualCashNaira = this.closeCash();
    if (actualCashNaira <= 0) {
      Swal.fire({ icon: 'error', title: 'Actual cash must be greater than 0' });
      return;
    }

    const actualCashKobo = Math.round(actualCashNaira * 100);
    const expectedKobo = shift.expectedCashKobo || 0;
    if (actualCashKobo !== expectedKobo) {
      const explanation = this.varianceExplanationFor(shift, actualCashKobo);
      Swal.fire({
        icon: 'warning',
        title: 'Cash variance detected!',
        html: `<p>${explanation}</p><p style="margin-top:8px;">Continue closing?</p>`,
        showCancelButton: true,
        confirmButtonText: 'Yes, close shift',
      }).then((result) => {
        if (result.isConfirmed) {
          this.performCloseShift(shift, actualCashKobo);
        }
      });
      return;
    }

    this.performCloseShift(shift, actualCashKobo);
  }

  performCloseShift(shift: Shift, actualCashKobo: number) {
    this.isSaving.set(true);
    const payload: CloseShiftRequest = {
      actual_cash_kobo: actualCashKobo,
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
        const explanation = this.varianceExplanationFor({ ...shift, actualCashKobo });
        Swal.fire({
          icon: actualCashKobo === (shift.expectedCashKobo || 0) ? 'success' : 'info',
          title: actualCashKobo === (shift.expectedCashKobo || 0) ? 'Shift Closed' : 'Shift Closed with Variance',
          html: `<p>${explanation}</p>`,
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to close shift' });
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