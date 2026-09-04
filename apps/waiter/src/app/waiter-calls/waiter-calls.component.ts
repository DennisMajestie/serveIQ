import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WaiterCallsApiService, WaiterCallDto } from '@serveiq/shared/data-access';
import { RealtimeSocketService, WaiterCallEvent } from '@serveiq/shared/data-access';
import { AuthService } from '@serveiq/shared/data-access';
import { Socket } from 'socket.io-client';
import { WaiterCallAlertService } from './waiter-call-alert.service';
import { OfflineDataService } from '../services/offline-data.service';

@Component({
  selector: 'app-waiter-calls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiter-calls.component.html',
  styleUrls: ['./waiter-calls.component.scss'],
})
export class WaiterCallsComponent implements OnInit, OnDestroy {
  private api = inject(WaiterCallsApiService);
  private socketSvc = inject(RealtimeSocketService);
  private auth = inject(AuthService);
  private callAlert = inject(WaiterCallAlertService);
  private offlineData = inject(OfflineDataService);
  private router = inject(Router);

  calls = signal<WaiterCallDto[]>([]);
  workload = signal<{ activeTables: number; maxTables: number; isAvailable: boolean } | null>(null);
  loading = signal(true);
  errorMsg = signal('');
  tableNumbers = signal<Record<string, string>>({});

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
    this.loadTableNumbers();
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 10000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const ev of Object.keys(this.handlers) as WaiterCallEvent[]) {
      this.socket?.off(ev, this.handlers[ev]);
    }
  }

  private loadTableNumbers() {
    this.offlineData.getTables().subscribe({
      next: (tables) => {
        const map: Record<string, string> = {};
        for (const t of tables || []) {
          if (t.id) map[t.id] = t.label || `Table ${t.tableNumber}`;
        }
        this.tableNumbers.set(map);
      },
      error: () => {},
    });
  }

  tableLabel(tableId: string): string {
    return this.tableNumbers()[tableId] || `Table ${tableId.slice(0, 8)}`;
  }

  refresh() {
    this.api.getMyCalls().subscribe({
      next: (data) => {
        this.calls.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Could not load waiter calls.');
        this.loading.set(false);
      },
    });
    this.api.getWorkload().subscribe({
      next: (w) => this.workload.set(w),
      error: () => {},
    });
  }

  accept(id: string) {
    this.api.accept(id).subscribe({ next: () => { this.callAlert.resetFor(id); this.refresh(); }, error: () => this.refresh() });
  }

  arrived(id: string) {
    this.api.arrived(id).subscribe({ next: () => this.refresh(), error: () => this.refresh() });
  }

  resolve(id: string) {
    this.api.resolve(id).subscribe({ next: () => this.refresh(), error: () => this.refresh() });
  }

  cancel(id: string) {
    this.api.cancel(id).subscribe({ next: () => this.refresh(), error: () => this.refresh() });
  }

  activeCalls = computed(() => this.calls().filter((c) => c.status !== 'resolved' && c.status !== 'cancelled'));

  goBack() {
    this.router.navigate(['/tables']);
  }
}
