import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './api/environment.token';

export type WaiterCallEvent =
  | 'waiter.request.created'
  | 'waiter.request.queued'
  | 'waiter.request.assigned'
  | 'waiter.request.accepted'
  | 'waiter.request.arrived'
  | 'waiter.request.resolved'
  | 'waiter.request.cancelled';

export interface WaiterCallSocketPayload {
  id: string;
  tableId: string;
  status: string;
  assignedWaiterId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RealtimeSocketService {
  private env = inject(ENVIRONMENT_CONFIG);
  private socket: Socket | null = null;

  /** Connect to the /realtime namespace. Pass the JWT used by the app. */
  connect(token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }
    this.socket = io(`${this.env.apiUrl}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    return this.socket;
  }

  get current(): Socket | null {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
