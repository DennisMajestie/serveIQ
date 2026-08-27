import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WaiterCallsApiService, WaiterCallDto } from '@serveiq/shared/data-access';
import { RealtimeSocketService, WaiterCallEvent } from '@serveiq/shared/data-access';
import { AuthService, UserApiService } from '@serveiq/shared/data-access';
import { User } from '@serveiq/shared/models';
import { Socket } from 'socket.io-client';

@Component({
  selector: 'app-admin-waiter-calls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-waiter-calls.component.html',
  styleUrls: ['./admin-waiter-calls.component.scss'],
})
export class AdminWaiterCallsComponent implements OnInit, OnDestroy {
  private api = inject(WaiterCallsApiService);
  private socketSvc = inject(RealtimeSocketService);
  private auth = inject(AuthService);
  private userApi = inject(UserApiService);

  active = signal<WaiterCallDto[]>([]);
  queue = signal<WaiterCallDto[]>([]);
  waiters = signal<User[]>([]);
  loading = signal(true);

  /** id of the call currently being reassigned (drives the inline picker). */
  reassignTarget = signal<string | null>(null);
  selectedWaiterId = signal<string>('');
  /** id of the call with an in-flight action, to disable its buttons. */
  busyId = signal<string | null>(null);

  private socket: Socket | null = null;
  private pollTimer: any = null;
  private handlers: Partial<Record<WaiterCallEvent, () => void>> = {};

  ngOnInit() {
    const token = this.auth.getToken() ?? '';
    this.socket = this.socketSvc.connect(token);
    const events: WaiterCallEvent[] = [
      'waiter.request.created',
      'waiter.request.queued',
      'waiter.request.assigned',
      'waiter.request.accepted',
      'waiter.request.arrived',
      'waiter.request.resolved',
      'waiter.request.cancelled',
    ];
    for (const ev of events) {
      const h = () => this.refresh();
      this.handlers[ev] = h;
      this.socket.on(ev, h);
    }
    this.loadWaiters();
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 10000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const ev of Object.keys(this.handlers) as WaiterCallEvent[]) {
      this.socket?.off(ev, this.handlers[ev]);
    }
  }

  loadWaiters() {
    this.userApi.listWaiters().subscribe({
      next: (data) => this.waiters.set(data ?? []),
      error: () => this.waiters.set([]),
    });
  }

  refresh() {
    this.api.getActive().subscribe({
      next: (data) => {
        this.active.set(data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getQueue().subscribe({
      next: (data) => this.queue.set(data ?? []),
      error: () => {},
    });
  }

  isActionable(status: string): boolean {
    return status === 'pending' || status === 'queued' || status === 'accepted' || status === 'arrived';
  }

  resolveCall(id: string) {
    this.busyId.set(id);
    this.api.resolve(id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.refresh();
      },
      error: () => this.busyId.set(null),
    });
  }

  cancelCall(id: string) {
    this.busyId.set(id);
    this.api.cancel(id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.refresh();
      },
      error: () => this.busyId.set(null),
    });
  }

  openReassign(call: WaiterCallDto) {
    this.reassignTarget.set(call.id);
    this.selectedWaiterId.set(call.assignedWaiter?.id ?? '');
  }

  closeReassign() {
    this.reassignTarget.set(null);
    this.selectedWaiterId.set('');
  }

  confirmReassign(call: WaiterCallDto) {
    const waiterId = this.selectedWaiterId();
    if (!waiterId) return;
    this.busyId.set(call.id);
    this.api.reassign(call.id, waiterId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.closeReassign();
        this.refresh();
      },
      error: () => {
        this.busyId.set(null);
        this.closeReassign();
      },
    });
  }

  formatTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
