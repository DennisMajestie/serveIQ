import { Injectable, inject, signal } from '@angular/core';
import { RealtimeSocketService, WaiterCallEvent, WaiterCallSocketPayload } from '@serveiq/shared/data-access';
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
  private tokenSub?: { unsubscribe(): void };

  /** Connect the global socket and start listening for calls assigned to this waiter. */
  connect() {
    // The app bootstraps before the waiter logs in, so the token may not exist
    // yet. Reconnect as soon as a token becomes available (login / session
    // rehydrate) so the always-on alert socket stays live on every page.
    this.tokenSub?.unsubscribe();
    this.tokenSub = this.auth.token$.subscribe((token) => {
      if (token) this.connectWithToken(token);
    });
    const existing = this.auth.getToken();
    if (existing) this.connectWithToken(existing);
  }

  private connectWithToken(token: string) {
    if (this.socket && this.socket.connected) return;
    this.socket = this.socketSvc.connect(token);
    const events: WaiterCallEvent[] = [
      'waiter.request.created',
      'waiter.request.queued',
      'waiter.request.assigned',
    ];
    for (const ev of events) {
      this.socket.on(ev, (p: WaiterCallSocketPayload) => this.onCall(p));
    }
  }

  private onCall(p: WaiterCallSocketPayload) {
    if (!p || !p.id) return;
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
