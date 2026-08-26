import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';

export interface WaiterCallDto {
  id: string;
  tableId: string;
  status: 'pending' | 'queued' | 'accepted' | 'arrived' | 'resolved' | 'cancelled';
  assignedWaiter?: { id: string; name?: string } | null;
  createdAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;
  message?: string;
  activeTables?: number;
  maxTables?: number;
  isAvailable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WaiterCallsApiService extends BaseApiService {
  private fullUrl = '';

  callWaiter(branchId: string, tableId: string, customerSessionId?: string) {
    return this.post<{ id: string; tableId: string; status: string; message?: string; assignedWaiter?: { id: string; name?: string } | null }>(
      `/api/v1/waiter-calls?branchId=${encodeURIComponent(branchId)}`,
      { tableId, customerSessionId },
    );
  }

  getStatus(id: string) {
    return this.get<WaiterCallDto>(`/api/v1/waiter-calls/${id}/status`);
  }

  getByTable(tableId: string) {
    return this.get<WaiterCallDto | null>(`/api/v1/waiter-calls/table/${tableId}`);
  }

  cancelByTable(tableId: string) {
    return this.post<{ id: string; status: string; cancelledAt?: string } | null>(
      `/api/v1/waiter-calls/table/${tableId}/cancel`,
    );
  }

  getMyCalls(status?: string) {
    return this.get<WaiterCallDto[]>(`/api/v1/waiter-calls`, undefined, status ? { status } : undefined);
  }

  getWorkload() {
    return this.get<{ activeTables: number; maxTables: number; isAvailable: boolean }>(
      `/api/v1/waiter-calls/workload/me`,
    );
  }

  accept(id: string) {
    return this.post<WaiterCallDto>(`/api/v1/waiter-calls/${id}/accept`);
  }

  arrived(id: string) {
    return this.post<WaiterCallDto>(`/api/v1/waiter-calls/${id}/arrived`);
  }

  resolve(id: string) {
    return this.post<WaiterCallDto>(`/api/v1/waiter-calls/${id}/resolve`);
  }

  cancel(id: string) {
    return this.post<WaiterCallDto>(`/api/v1/waiter-calls/${id}/cancel`);
  }

  getActive() {
    return this.get<WaiterCallDto[]>(`/api/v1/waiter-calls/active`);
  }

  getQueue() {
    return this.get<WaiterCallDto[]>(`/api/v1/waiter-calls/queue`);
  }
}
