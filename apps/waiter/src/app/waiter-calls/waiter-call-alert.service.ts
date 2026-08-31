import { Injectable, inject, signal } from '@angular/core';
import { RealtimeSocketService, WaiterCallSocketPayload } from '@serveiq/shared/data-access';
import { AuthService } from '@serveiq/shared/data-access';
import { Socket } from 'socket.io-client';

export interface IncomingWaiterCall {
  id: string;
  tableId: string;
  assignedWaiterId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class WaiterCallAlertService {
  private socketSvc = inject(RealtimeSocketService);
  private auth = inject(AuthService);

  /** Latest unhandled incoming call for THIS waiter (null when none). */
  readonly incoming = signal<IncomingWaiterCall | null>(null);

  /** True while the alert banner is visible for an incoming call. */
  readonly alertVisible = signal(false);

  private socket: Socket | null = null;
  private consumedIds = new Set<string>();

  /** Connect the global socket and start listening for calls assigned to this waiter. */
  connect() {
    const token = this.auth.getToken() ?? '';
    if (!token) return;
    this.socket = this.socketSvc.connect(token);
    this.socket.on('waiter.request.created', (p: WaiterCallSocketPayload) => this.onCall(p));
    this.socket.on('waiter.request.assigned', (p: WaiterCallSocketPayload) => this.onCall(p));
  }

  private onCall(p: WaiterCallSocketPayload) {
    const myId = localStorage.getItem('userId');
    if (!p || !p.id) return;
    if (myId && p.assignedWaiterId && p.assignedWaiterId !== myId) return;
    if (this.consumedIds.has(p.id)) return;
    this.consumedIds.add(p.id);
    this.incoming.set({ id: p.id, tableId: p.tableId, assignedWaiterId: p.assignedWaiterId });
    this.alertVisible.set(true);
  }

  /** Dismiss the current alert (caller navigated away / accepted from elsewhere). */
  dismiss() {
    this.alertVisible.set(false);
    this.incoming.set(null);
  }

  resetFor(id: string) {
    this.alertVisible.set(false);
    if (this.incoming()?.id === id) this.incoming.set(null);
  }
}
