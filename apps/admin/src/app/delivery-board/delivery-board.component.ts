import { Component, signal, computed, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RidersApiService, DeliveriesApiService } from '@serveiq/shared/data-access';
import { DeliveryJob } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delivery-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-board.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./delivery-board.component.scss'],
})
export class DeliveryBoardComponent implements OnInit, OnDestroy {
  private ridersApi = inject(RidersApiService);
  private deliveriesApi = inject(DeliveriesApiService);

  isOnline = signal(false);
  isLoading = signal(true);
  jobs = signal<DeliveryJob[]>([]);
  accepting = signal<string | null>(null);
  delivering = signal<string | null>(null);

  private pollTimer?: ReturnType<typeof setInterval>;

  /** Open jobs a rider can accept (pending, not yet assigned). */
  availableJobs = computed(() =>
    this.jobs()
      .filter(j => j.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  /** Jobs already assigned to this rider. */
  myJobs = computed(() =>
    this.jobs()
      .filter(j => j.riderUserId && j.status !== 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  earnings = computed(() => this.myJobs().filter(j => j.status === 'delivered').reduce((s, j) => s + j.payoutKobo, 0));

  ngOnInit() {
    this.isOnline.set(localStorage.getItem('rider_online') === '1');
    this.loadJobs();
    this.pollTimer = setInterval(() => this.loadJobs(), 10000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private loadJobs() {
    this.deliveriesApi.available().subscribe({
      next: (jobs) => {
        this.jobs.set(Array.isArray(jobs) ? jobs : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggleOnline() {
    this.ridersApi.toggleOnline().subscribe({
      next: (res) => {
        this.isOnline.set(res.isOnline);
        localStorage.setItem('rider_online', res.isOnline ? '1' : '0');
        Swal.fire({
          icon: 'info',
          title: res.isOnline ? 'You are online' : 'You are offline',
          text: res.isOnline
            ? 'You will be notified when new deliveries are available.'
            : 'New delivery notifications are paused.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Toggle Failed', text: 'Could not change availability.' });
      },
    });
  }

  accept(job: DeliveryJob) {
    this.accepting.set(job.id);
    this.deliveriesApi.accept(job.id).subscribe({
      next: () => {
        this.accepting.set(null);
        this.loadJobs();
      },
      error: (err) => {
        this.accepting.set(null);
        const msg = err?.serverMessage || err?.error?.message || 'This delivery may have just been taken by another rider';
        Swal.fire({ icon: 'error', title: 'Could Not Accept', text: msg });
      },
    });
  }

  markDelivered(job: DeliveryJob) {
    this.delivering.set(job.id);
    this.deliveriesApi.deliver(job.id).subscribe({
      next: () => {
        this.delivering.set(null);
        Swal.fire({ icon: 'success', title: 'Delivery Completed', text: 'Thanks for delivering!', timer: 1500, showConfirmButton: false });
        this.loadJobs();
      },
      error: (err) => {
        this.delivering.set(null);
        const msg = err?.serverMessage || err?.error?.message || 'Could not complete the delivery';
        Swal.fire({ icon: 'error', title: 'Failed', text: msg });
      },
    });
  }

  formatKobo(kobo: number): string {
    return `₦${((kobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      accepted: 'Collecting order',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
    };
    return labels[status] || status.replace(/_/g, ' ');
  }
}