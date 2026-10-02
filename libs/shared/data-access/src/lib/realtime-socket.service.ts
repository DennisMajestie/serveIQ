import { Injectable, inject } from '@angular/core';
import type { Socket } from 'socket.io-client';
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
  private connecting: Promise<Socket> | null = null;

  /**
   * Connect to the /realtime namespace. Pass the JWT used by the app.
   *
   * `socket.io-client` is imported dynamically so it is not part of the initial
   * bundle; the service is declared in a barrel that app bootstrap reaches, which
   * previously pulled the whole socket stack (~49 kB) into the first load. Callers
   * are all lazily-loaded route components that need a live socket to do anything
   * useful, so awaiting here costs nothing.
   *
   * `connecting` guards the gap the `await import()` opens: without it two
   * overlapping calls both see `this.socket.connected === false` and each create
   * a socket, leaking one.
   */
  async connect(token: string): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      const { io } = await import('socket.io-client');
      this.socket = io(`${this.env.apiUrl}/realtime`, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      });
      return this.socket;
    })();

    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  get current(): Socket | null {
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}