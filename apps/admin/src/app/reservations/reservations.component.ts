import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  ReservationsApiService,
  BranchesApiService,
} from '@serveiq/shared/data-access';
import {
  Reservation,
  ReservationStatus,
  ReservationSource,
  WalkinReservationRequest,
} from '@serveiq/shared/models';

const STATUS_OPTIONS: { label: string; value: ReservationStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: ReservationStatus.PENDING },
  { label: 'Confirmed', value: ReservationStatus.CONFIRMED },
  { label: 'Seated', value: ReservationStatus.SEATED },
  { label: 'Completed', value: ReservationStatus.COMPLETED },
  { label: 'Cancelled', value: ReservationStatus.CANCELLED },
  { label: 'No-show', value: ReservationStatus.NO_SHOW },
];

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./reservations.component.scss'],
})
export class ReservationsComponent implements OnInit {
  private reservationsApi = inject(ReservationsApiService);
  private branchesApi = inject(BranchesApiService);

  branchId = signal<string>('');
  branches = signal<{ id: string; name: string }[]>([]);
  reservations = signal<Reservation[]>([]);
  isLoading = signal(false);
  statusFilter = signal<ReservationStatus | ''>('');
  searchTerm = signal('');
  summary = signal<{ upcoming: number; seated: number; completed: number; pending: number; walkins: number }>({
    upcoming: 0,
    seated: 0,
    completed: 0,
    pending: 0,
    walkins: 0,
  });

  today = new Date().toISOString().split('T')[0];

  statusOptions = STATUS_OPTIONS;
  ReservationStatus = ReservationStatus;
  ReservationSource = ReservationSource;
  Math = Math;

  filteredReservations = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.reservations().filter((r) => {
      const matchesStatus = !this.statusFilter() || r.status === this.statusFilter();
      const matchesSearch =
        !search ||
        r.customerName.toLowerCase().includes(search) ||
        (r.customerPhone || '').toLowerCase().includes(search) ||
        (r.confirmationCode || '').toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  });

  ngOnInit() {
    this.branchId.set(
      localStorage.getItem('branchId') || localStorage.getItem('activeBranchId') || ''
    );
    this.loadBranches();
    this.load();
  }

  async loadBranches() {
    try {
      const list = await this.branchesApi.list().toPromise();
      this.branches.set(list ?? []);
    } catch {
      /* non-critical */
    }
  }

  async load() {
    this.isLoading.set(true);
    try {
      const [reservations, summary] = await Promise.all([
        this.reservationsApi.list({ branchId: this.branchId() || undefined }).toPromise(),
        this.reservationsApi.getTodaySummary(this.branchId() || undefined).toPromise(),
      ]);
      this.reservations.set(reservations ?? []);
      if (summary) this.summary.set(summary);
    } catch {
      Swal.fire({ icon: 'error', title: 'Load failed', timer: 2000, showConfirmButton: false });
    } finally {
      this.isLoading.set(false);
    }
  }

  onBranchChange(event: Event) {
    this.branchId.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  statusClass(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'badge-pending';
      case ReservationStatus.CONFIRMED:
        return 'badge-confirmed';
      case ReservationStatus.SEATED:
        return 'badge-seated';
      case ReservationStatus.COMPLETED:
        return 'badge-completed';
      case ReservationStatus.CANCELLED:
        return 'badge-cancelled';
      case ReservationStatus.NO_SHOW:
        return 'badge-now-show';
      default:
        return '';
    }
  }

  statusLabel(status: ReservationStatus): string {
    return status.replace('_', ' ');
  }

  formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async confirmReservation(r: Reservation) {
    const cmd = await Swal.fire({
      icon: 'question',
      title: 'Confirm reservation',
      text: `Confirm booking for ${r.customerName}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
    });
    if (!cmd.isConfirmed) return;
    await this.updateStatus(r, ReservationStatus.CONFIRMED);
  }

  async cancelReservation(r: Reservation) {
    const { value: reason } = await Swal.fire({
      title: 'Cancel reservation',
      input: 'text',
      inputPlaceholder: 'Reason (optional)',
      showCancelButton: true,
      confirmButtonText: 'Cancel Booking',
      icon: 'warning',
    });
    if (reason === undefined) return;
    if (reason === '') {
      Swal.fire({ icon: 'error', title: 'Reason required', timer: 1500 });
      return;
    }
    await this.updateStatus(r, ReservationStatus.CANCELLED, reason);
  }

  async markNoShow(r: Reservation) {
    const cmd = await Swal.fire({
      icon: 'question',
      title: 'Mark as no-show?',
      text: `Mark ${r.customerName}'s booking as no-show`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
    });
    if (!cmd.isConfirmed) return;
    await this.updateStatus(r, ReservationStatus.NO_SHOW);
  }

  async seatReservation(r: Reservation) {
    const cmd = await Swal.fire({
      icon: 'question',
      title: 'Seat guest',
      text: `Seat ${r.customerName} now? This opens a tab for their table.`,
      showCancelButton: true,
      confirmButtonText: 'Seat Now',
    });
    if (!cmd.isConfirmed) return;
    try {
      await this.reservationsApi.seat(r.id).toPromise();
      Swal.fire({ icon: 'success', title: 'Guest seated', text: 'A tab has been opened', timer: 1500, showConfirmButton: false });
      this.load();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.serverMessage || err?.error?.message || 'Could not seat guest' });
    }
  }

  private async updateStatus(r: Reservation, status: ReservationStatus, reason?: string) {
    try {
      await this.reservationsApi.update(r.id, { status, cancellationReason: reason }).toPromise();
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false });
      this.load();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.serverMessage || err?.error?.message || 'Update failed' });
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  async openWalkinForm() {
    const { value: formValues, isConfirmed } = await Swal.fire({
      title: 'New Walk-in',
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Customer name" autocomplete="name">
        <input id="swal-phone" class="swal2-input" placeholder="Phone number" type="tel" autocomplete="tel">
        <input id="swal-size" class="swal2-input" placeholder="Party size" type="number" min="1" max="20" value="2">
        <select id="swal-table" class="swal2-select swal2-input" style="width:100%">
          <option value="">Any available table</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value.trim();
        const size = Number((document.getElementById('swal-size') as HTMLInputElement).value || 2);
        if (!name) {
          Swal.showValidationMessage('Customer name is required');
          return false;
        }
        if (!phone) {
          Swal.showValidationMessage('Phone number is required');
          return false;
        }
        return { name, phone, size };
      },
      showCancelButton: true,
      confirmButtonText: 'Seat Walk-in',
    });

    if (!isConfirmed || !formValues) return;

    const payload: WalkinReservationRequest = {
      customerName: formValues.name,
      customerPhone: formValues.phone,
      partySize: formValues.size,
    };

    try {
      await this.reservationsApi.createWalkin(payload).toPromise();
      Swal.fire({ icon: 'success', title: 'Walk-in seated', text: 'A tab has been opened', timer: 1500, showConfirmButton: false });
      this.load();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.serverMessage || err?.error?.message || 'Could not create walk-in' });
    }
  }

  async sendReminders() {
    try {
      const res = await this.reservationsApi.sendReminders().toPromise();
      Swal.fire({ icon: 'success', title: 'Reminders sent', text: `${res?.sent ?? 0} notification(s)`, timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.serverMessage || err?.error?.message || 'Could not send reminders' });
    }
  }
}