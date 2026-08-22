import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OfflineCacheService, SyncQueueEntry } from './offline-cache.service';
import { NetworkService } from './network.service';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './api/environment.token';
import { catchError, firstValueFrom, timeout } from 'rxjs';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
/** Periodic sweep while the app stays online (covers server restarts etc.). */
const RETRY_TICK_MS = 30_000;
/** Entries that exhausted in-process retries get re-attempted at most this often. */
const DEAD_RETRY_MS = 5 * 60_000;

@Injectable({ providedIn: 'root' })
export class OfflineSyncEngine {
  private cache = inject(OfflineCacheService);
  private network = inject(NetworkService);
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT_CONFIG);

  readonly pendingCount = signal(0);
  readonly lastSyncError = signal<string | null>(null);
  private processing = false;
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.refreshPendingCount();
    effect(() => {
      if (this.network.isOnline()) this.processSync();
    });
    this.retryTimer = setInterval(() => {
      if (this.network.isOnline() && this.pendingCount() > 0 && !this.processing) {
        void this.processSync();
      }
    }, RETRY_TICK_MS);
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
    await this.cache.queueMutation(entry);
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

      const now = Date.now();
      let anyFailed = false;

      for (const entry of queue) {
        // Exhausted entries are retried again after a cool-down instead of
        // being stranded forever — server outages should heal themselves.
        if (entry.attempts >= MAX_RETRIES) {
          const sinceLast = now - (entry.lastAttemptAt ?? 0);
          if (sinceLast < DEAD_RETRY_MS) {
            continue;
          }
        }

        let attempts = entry.attempts >= MAX_RETRIES ? 0 : entry.attempts; // dead-entry revival starts a fresh cycle
        let lastErr: unknown = null;

        for (; attempts < MAX_RETRIES; attempts++) {
          try {
            await this.replayMutation(entry);
            await this.cache.removeMutation(entry.id);
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

        await this.cache.updateMutation(entry.id, { attempts, lastAttemptAt: Date.now() });
        if (lastErr) {
          const message = lastErr instanceof Error ? lastErr.message : 'Sync failed';
          await this.cache.updateMutation(entry.id, { lastError: message });
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
