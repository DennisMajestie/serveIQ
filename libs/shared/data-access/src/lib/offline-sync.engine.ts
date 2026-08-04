import { Injectable, inject, signal, effect, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OfflineCacheService, SyncQueueEntry } from './offline-cache.service';
import { NetworkService } from './network.service';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './api/environment.token';
import { catchError, firstValueFrom, timeout } from 'rxjs';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

@Injectable({ providedIn: 'root' })
export class OfflineSyncEngine {
  private cache = inject(OfflineCacheService);
  private network = inject(NetworkService);
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT_CONFIG);

  readonly pendingCount = signal(0);
  readonly lastSyncError = signal<string | null>(null);
  private processing = false;

  constructor() {
    this.refreshPendingCount();
    effect(() => {
      if (this.network.isOnline()) this.processSync();
    });
  }

  private syncUrl(path: string): string {
    return `${this.env.apiUrl}/api/v1/sync/${path}`;
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

      let anyFailed = false;
      for (const entry of queue) {
        // Skip entries that have already hit max retries
        if (entry.attempts >= MAX_RETRIES) {
          if (entry.lastError) this.lastSyncError.set(entry.lastError);
          anyFailed = true;
          continue;
        }

        let attempts = entry.attempts;
        let lastErr: unknown = null;

        for (; attempts < MAX_RETRIES; attempts++) {
          try {
            await this.replayMutation(entry);
            this.cache.removeMutation(entry.id);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            if (attempts + 1 < MAX_RETRIES) {
              const delay = BASE_DELAY_MS * Math.pow(2, attempts);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }

        this.cache.updateMutation(entry.id, { attempts });
        if (lastErr) {
          const message = lastErr instanceof Error ? lastErr.message : 'Sync failed';
          this.cache.updateMutation(entry.id, { lastError: message });
          this.lastSyncError.set(message);
          anyFailed = true;
        }
      }

      if (!anyFailed) {
        this.lastSyncError.set(null);
      }
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
      this.http.post(this.syncUrl('queue'), body, { headers }).pipe(
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
