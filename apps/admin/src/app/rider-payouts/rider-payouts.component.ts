import { Component, signal, computed, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RidersApiService,
  RiderPendingPayout,
  RiderPayoutDetail,
  RiderLedgerEntry,
  PayoutBatch,
  PayoutProvider,
} from '@serveiq/shared/data-access';
import { API_CONFIG, buildUrl } from '@serveiq/shared/data-access';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rider-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider-payouts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./rider-payouts.component.scss'],
})
export class RiderPayoutsComponent implements OnInit {
  private ridersApi = inject(RidersApiService);
  private http = inject(HttpClient);

  pendingPayouts = signal<RiderPendingPayout[]>([]);
  selectedRiderDetail = signal<RiderPayoutDetail | null>(null);
  selectedRiderId = signal<string | null>(null);
  riderLedger = signal<RiderLedgerEntry[]>([]);
  riderBatches = signal<PayoutBatch[]>([]);
  isLoading = signal(false);
  isProcessing = signal(false);
  showDetailModal = signal(false);
  activeTab = signal<'pending' | 'ledger' | 'batches'>('pending');

  // For template access
  Math = Math;

  ngOnInit() {
    this.loadPendingPayouts();
  }

  loadPendingPayouts() {
    this.isLoading.set(true);
    this.ridersApi.getPendingPayouts().subscribe({
      next: (data) => {
        this.pendingPayouts.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  async openRiderDetail(rider: RiderPendingPayout) {
    this.selectedRiderId.set(rider.riderId);
    this.isLoading.set(true);
    try {
      const [detail, ledger, batches] = await Promise.all([
        this.ridersApi.getRiderPendingPayouts(rider.riderId).toPromise(),
        this.ridersApi.getRiderLedger(rider.riderId, 50).toPromise(),
        this.ridersApi.getRiderPayoutBatches(rider.riderId, 20).toPromise(),
      ]);
      this.selectedRiderDetail.set(detail ?? { deliveries: [], totalPayoutKobo: 0 });
      this.riderLedger.set(Array.isArray(ledger) ? ledger : []);
      this.riderBatches.set(Array.isArray(batches) ? batches : []);
      this.activeTab.set('ledger');
      this.showDetailModal.set(true);
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to load', timer: 2000, showConfirmButton: false });
    } finally {
      this.isLoading.set(false);
    }
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedRiderId.set(null);
    this.selectedRiderDetail.set(null);
    this.riderLedger.set([]);
    this.riderBatches.set([]);
  }

  async processPayout(rider: RiderPendingPayout) {
    const { value } = await Swal.fire({
      title: `Pay ${rider.riderName}?`,
      html: `
        <div style="text-align:left">
          <p><strong>Pending deliveries:</strong> ${rider.pendingDeliveries}</p>
          <p><strong>Total payout:</strong> ${this.formatKobo(rider.totalPayoutKobo)}</p>
          <label>Payout method</label>
          <select id="swal-provider" class="swal2-select">
            <option value="manual">Manual (cash/bank transfer)</option>
            <option value="paystack">Paystack Transfer</option>
            <option value="flutterwave">Flutterwave Transfer</option>
          </select>
          <label style="margin-top:8px">Provider reference (optional)</label>
          <input id="swal-ref" class="swal2-input" placeholder="Transfer reference from provider">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Process Payout',
      preConfirm: () => {
        const provider = (document.getElementById('swal-provider') as HTMLSelectElement).value as PayoutProvider;
        const providerBatchId = (document.getElementById('swal-ref') as HTMLInputElement).value?.trim() || undefined;
        return { provider, providerBatchId };
      },
    });

    if (!value) return;

    this.isProcessing.set(true);
    try {
      const result = await this.ridersApi.processRiderPayout(rider.riderId, value).toPromise();
      Swal.fire({
        icon: 'success',
        title: 'Payout Processed',
        html: `Marked <strong>${result!.deliveriesPaid}</strong> deliveries as paid.<br>Total: <strong>${this.formatKobo(result!.totalKobo)}</strong><br>Batch: <code>${result!.batch.id.slice(0, 8)}</code>`,
      });
      this.loadPendingPayouts();
      if (this.selectedRiderId() === rider.riderId) {
        this.openRiderDetail(rider);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Payout Failed', text: err?.serverMessage || err?.error?.message || 'Could not process payout' });
    } finally {
      this.isProcessing.set(false);
    }
  }

  async completeBatch(batch: PayoutBatch) {
    const { value: providerBatchId } = await Swal.fire({
      title: 'Mark Batch Completed',
      input: 'text',
      inputLabel: 'Provider transfer reference / batch ID',
      inputPlaceholder: 'e.g. trf_123456789',
      showCancelButton: true,
      confirmButtonText: 'Mark Completed',
    });
    if (!providerBatchId) return;

    try {
      await this.http.post<any>(
        buildUrl(API_CONFIG.endpoints.deliveries.completePayoutBatch, { id: batch.id }),
        { providerBatchId }
      ).toPromise();
      Swal.fire({ icon: 'success', title: 'Batch Completed', timer: 2000, showConfirmButton: false });
      // Refresh the detail view
      if (this.selectedRiderId()) {
        this.openRiderDetail({ riderId: this.selectedRiderId()!, riderName: '', pendingDeliveries: 0, totalPayoutKobo: 0 } as RiderPendingPayout);
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', timer: 2000, showConfirmButton: false });
    }
  }

  formatKobo(kobo: number): string {
    return `₦${(kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      default: return '';
    }
  }

  getProviderLabel(provider: string): string {
    switch (provider) {
      case 'paystack': return 'Paystack';
      case 'flutterwave': return 'Flutterwave';
      default: return 'Manual';
    }
  }

  getLedgerTypeLabel(type: string): string {
    switch (type) {
      case 'delivery_earning': return 'Delivery Earning';
      case 'payout': return 'Payout';
      case 'adjustment': return 'Adjustment';
      default: return type;
    }
  }

  getLedgerTypeClass(type: string): string {
    switch (type) {
      case 'delivery_earning': return 'ledger-credit';
      case 'payout': return 'ledger-debit';
      case 'adjustment': return 'ledger-adjustment';
      default: return '';
    }
  }
}