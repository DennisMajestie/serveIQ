import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OfflineCacheService, SyncQueueEntry } from './offline-cache.service';
import { NetworkService } from './network.service';
import { catchError, firstValueFrom, timeout } from 'rxjs';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

@Injectable({ providedIn: 'root' })
export class OfflineSyncEngine {
  private cache = inject(OfflineCacheService);
  private network = inject(NetworkService);
  private http = inject(HttpClient);

  readonly pendingCount = signal(0);
  readonly lastSyncError = signal<string | null>(null);
  private processing = false;

  constructor() {
    this.refreshPendingCount();
    effect(() => {
      if (this.network.isOnline()) this.processSync();
    });
  }

  async queueMutation(entityType: string, operation: string, payload: any): Promise<void> {
    const entry: SyncQueueEntry = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      entityType,
      operation,
      payload,
      clientIdempotencyKey: `${entityType}.${operation}.${payload.id ?? Date.now()}`,
      timestamp: Date.now(),
      attempts: 0,
    };
    this.cache.queueMutation(entry);
    this.refreshPendingCount();

    if (this.network.isOnline()) {
      this.processSync();
    }
  }

  async processSync(): Promise<void> {
    if (this.processing || !this.network.isOnline()) return;
    this.processing = true;

    try {
      const queue = await firstValueFrom(this.cache.getPendingMutations());
      if (queue.length === 0) {
        this.lastSyncError.set(null);
        return;
      }

      for (const entry of queue) {
        try {
          await this.replayMutation(entry);
          this.cache.removeMutation(entry.id);
        } catch (err) {
          entry.attempts++;
          if (entry.attempts >= MAX_RETRIES) {
            entry.lastError = err instanceof Error ? err.message : 'Sync failed';
            this.cache.updateMutation(entry.id, { attempts: entry.attempts, lastError: entry.lastError });
            this.lastSyncError.set(entry.lastError);
          } else {
            const delay = BASE_DELAY_MS * Math.pow(2, entry.attempts - 1);
            this.cache.updateMutation(entry.id, { attempts: entry.attempts });
            await new Promise(r => setTimeout(r, delay));
            return this.processSync();
          }
        }
      }

      this.lastSyncError.set(null);
    } finally {
      this.processing = false;
      this.refreshPendingCount();
    }
  }

  private async replayMutation(entry: SyncQueueEntry): Promise<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      entity_type: entry.entityType,
      operation: entry.operation,
      payload: entry.payload,
      client_idempotency_key: entry.clientIdempotencyKey,
    };

    await firstValueFrom(
      this.http.post('/api/v1/sync/queue', body, { headers }).pipe(
        timeout(10000),
        catchError((err) => { throw err; })
      )
    );
  }

  private refreshPendingCount(): void {
    this.cache.getPendingMutations().subscribe(queue => {
      this.pendingCount.set(queue.length);
    });
  }
}
