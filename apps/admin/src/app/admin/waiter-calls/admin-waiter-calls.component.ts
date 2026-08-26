import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaiterCallsApiService, WaiterCallDto } from '@serveiq/shared/data-access';
import { RealtimeSocketService, WaiterCallEvent } from '@serveiq/shared/data-access';
import { AuthService } from '@serveiq/shared/data-access';
import { Socket } from 'socket.io-client';

@Component({
  selector: 'app-admin-waiter-calls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-waiter-calls.component.html',
  styleUrls: ['./admin-waiter-calls.component.scss'],
})
export class AdminWaiterCallsComponent implements OnInit, OnDestroy {
  private api = inject(WaiterCallsApiService);
  private socketSvc = inject(RealtimeSocketService);
  private auth = inject(AuthService);

  active = signal<WaiterCallDto[]>([]);
  queue = signal<WaiterCallDto[]>([]);
  loading = signal(true);

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
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 10000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const ev of Object.keys(this.handlers) as WaiterCallEvent[]) {
      this.socket?.off(ev, this.handlers[ev]);
    }
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
}
