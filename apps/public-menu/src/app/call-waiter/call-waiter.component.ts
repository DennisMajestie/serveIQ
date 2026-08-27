import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerApiService } from '../services/customer-api.service';
import { CartService } from '../services/cart.service';

type CallStatus = 'idle' | 'pending' | 'queued' | 'accepted' | 'arrived' | 'resolved' | 'cancelled';

@Component({
  selector: 'app-call-waiter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-waiter.component.html',
  styleUrls: ['./call-waiter.component.scss'],
})
export class CallWaiterComponent implements OnInit, OnDestroy {
  private api = inject(CustomerApiService);
  private cart = inject(CartService);

  status = signal<CallStatus>('idle');
  callId = signal<string | null>(null);
  message = signal<string>('');
  hasTable = computed(() => !!this.cart.tableId());
  isDineIn = computed(() => this.cart.orderType() === 'dine_in');
  busy = signal(false);
  showTableInput = signal(false);
  tableNumber = signal('');
  tableError = signal('');

  private pollTimer: any = null;

  ngOnInit() {
    if (this.isDineIn() && this.hasTable()) {
      this.checkExisting();
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private checkExisting() {
    const tableId = this.cart.tableId();
    const branchId = this.cart.branchId();
    if (!tableId || !branchId) return;
    this.api.getWaiterCallByTable(tableId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (data && ['pending', 'queued', 'accepted', 'arrived'].includes(data.status)) {
          this.callId.set(data.id);
          this.applyStatus(data.status, data.message);
          this.startPolling();
        }
      },
      error: () => {},
    });
  }

  call() {
    const tableId = this.cart.tableId();
    const branchId = this.cart.branchId();
    if (!branchId || this.busy()) return;

    if (!tableId) {
      this.showTableInput.set(true);
      this.tableError.set('');
      return;
    }

    this.doCall(tableId, branchId);
  }

  async resolveAndCall() {
    const number = this.tableNumber().trim();
    const branchId = this.cart.branchId();
    if (!number || !branchId || this.busy()) return;

    this.busy.set(true);
    this.tableError.set('');

    try {
      const res = await this.api.resolveTable(branchId, number).toPromise();
      const tableId = res?.tableId;
      if (!tableId) throw new Error('No table ID returned');
      this.showTableInput.set(false);
      this.tableNumber.set('');
      this.doCall(tableId, branchId);
    } catch (err: any) {
      this.busy.set(false);
      this.tableError.set(err?.error?.message || 'Table not found. Check the number and try again.');
    }
  }

  private doCall(tableId: string, branchId: string) {
    this.api.callWaiter(branchId, tableId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.callId.set(data?.id ?? null);
        this.applyStatus(data?.status ?? 'pending', data?.message);
        this.busy.set(false);
        this.startPolling();
      },
      error: (err: any) => {
        this.message.set(err?.error?.message || 'Could not reach a waiter. Try again.');
        this.busy.set(false);
      },
    });
  }

  cancel() {
    const tableId = this.cart.tableId();
    if (!tableId) return;
    this.busy.set(true);
    this.api.cancelWaiterCallByTable(tableId).subscribe({
      next: () => {
        this.reset();
        this.busy.set(false);
      },
      error: () => {
        this.reset();
        this.busy.set(false);
      },
    });
  }

  private applyStatus(s: string, msg?: string) {
    this.status.set(s as CallStatus);
    if (msg) this.message.set(msg);
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => this.poll(), 4000);
  }

  private poll() {
    const id = this.callId();
    if (!id) return;
    this.api.getWaiterCallStatus(id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (!data) {
          this.reset();
          return;
        }
        this.applyStatus(data.status, data.message);
        if (data.status === 'resolved' || data.status === 'cancelled') {
          this.stopPolling();
          if (data.status === 'resolved') {
            setTimeout(() => this.reset(), 4000);
          }
        }
      },
      error: () => this.stopPolling(),
    });
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private reset() {
    this.stopPolling();
    this.callId.set(null);
    this.status.set('idle');
    this.message.set('');
  }

  buttonLabel = computed(() => {
    switch (this.status()) {
      case 'idle':
        return 'Call Waiter';
      case 'pending':
        return 'Finding a waiter…';
      case 'queued':
        return 'In queue…';
      case 'accepted':
        return 'Waiter on the way';
      case 'arrived':
        return 'Waiter arrived';
      default:
        return 'Call Waiter';
    }
  });
}
