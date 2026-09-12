import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsApiService } from '@serveiq/shared/data-access';
import {
  ReservationSource,
  AvailabilitySlot,
  CreateReservationRequest,
} from '@serveiq/shared/models';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

const STEP_ORDER: ('date' | 'time' | 'details' | 'confirm')[] = ['date', 'time', 'details', 'confirm'];

@Component({
  selector: 'app-reservation-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-booking.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./reservation-booking.component.scss'],
})
export class ReservationBookingComponent implements OnInit {
  private reservationsApi = inject(ReservationsApiService);
  private route = inject(ActivatedRoute);

  branchId = signal<string>('');
  step = signal<'date' | 'time' | 'details' | 'confirm'>('date');
  selectedDate = signal<string>('');
  slots = signal<AvailabilitySlot[]>([]);
  selectedSlot = signal<AvailabilitySlot | null>(null);
  partySize = signal(2);
  minDate = '';
  maxDate = '';
  isLoading = signal(false);
  isSubmitting = signal(false);

  form = signal<CreateReservationRequest>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 2,
    reservationTime: '',
    specialRequests: '',
    source: ReservationSource.PUBLIC,
  });

  stepIndex = (s: string): number => STEP_ORDER.indexOf(s as 'date' | 'time' | 'details' | 'confirm');
  currentStepIndex = computed(() => this.stepIndex(this.step()));
  progressValue = computed(() => this.currentStepIndex() + 1);

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    const max = new Date(today);
    max.setDate(max.getDate() + 30);
    this.maxDate = max.toISOString().split('T')[0];

    this.route.paramMap.subscribe(params => {
      const branchId = params.get('branchId');
      if (branchId) {
        this.branchId.set(branchId);
      } else {
        const stored = localStorage.getItem('activeBranchId') || localStorage.getItem('branchId');
        if (stored) this.branchId.set(stored);
      }
    });

    this.route.queryParams.subscribe(qp => {
      if (qp['party']) this.partySize.set(Number(qp['party']));
      if (qp['date']) {
        this.selectedDate.set(qp['date']);
        this.step.set('time');
        this.loadSlots();
      }
    });
  }

  async loadSlots() {
    if (!this.branchId() || !this.selectedDate()) return;
    this.isLoading.set(true);
    try {
      const res = await this.reservationsApi.checkAvailability({
        date: this.selectedDate(),
        partySize: this.partySize(),
        branchId: this.branchId(),
      }).toPromise();
      this.slots.set(res?.slots ?? []);
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to load slots', timer: 2000, showConfirmButton: false });
    } finally {
      this.isLoading.set(false);
    }
  }

  onDateChange() {
    this.selectedSlot.set(null);
    this.step.set('time');
    this.loadSlots();
  }

  onDateInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.onDateChange();
  }

  onPartyInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.partySize.set(Number.isFinite(value) ? value : 1);
  }

  incrementPartySize(): void {
    this.partySize.update(v => Math.min(20, v + 1));
  }

  decrementPartySize(): void {
    this.partySize.update(v => Math.max(1, v - 1));
  }

  selectSlot(slot: AvailabilitySlot) {
    this.selectedSlot.set(slot);
    this.form.update(f => ({ ...f, reservationTime: slot.start }));
    this.step.set('details');
  }

  async submit() {
    if (this.isSubmitting()) return;
    const f = this.form();
    if (!f.customerName.trim() || !f.customerPhone.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Details', text: 'Name and phone are required' });
      return;
    }
    if (!this.selectedSlot()) {
      Swal.fire({ icon: 'error', title: 'Select Time', text: 'Please choose a time slot' });
      return;
    }

    this.isSubmitting.set(true);
    try {
      const res = await this.reservationsApi
        .create(
          {
            ...f,
            partySize: this.partySize(),
            reservationTime: this.selectedSlot()!.start,
          },
          this.branchId(),
        )
        .toPromise();

      if (res) {
        this.step.set('confirm');
        Swal.fire({
          icon: 'success',
          title: 'Reservation Confirmed!',
          html: `
            <p>Your table is booked for <strong>${this.formatDateTime(res.reservationTime)}</strong></p>
            <p>Party of <strong>${res.partySize}</strong></p>
            <p>Confirmation code: <code>${res.confirmationCode}</code></p>
            <p class="mt-2 text-sm text-muted">Save this code to manage your reservation</p>
          `,
          confirmButtonText: 'Done',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: err?.serverMessage || err?.error?.message || 'Could not create reservation',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  restart() {
    this.step.set('date');
    this.selectedSlot.set(null);
    this.form.set({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: 2,
      reservationTime: '',
      specialRequests: '',
      source: ReservationSource.PUBLIC,
    });
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  getSlotEndTime(slot: AvailabilitySlot): string {
    return new Date(slot.end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
}