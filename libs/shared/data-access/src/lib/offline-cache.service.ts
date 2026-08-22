import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface SyncQueueEntry {
  id: string;
  entityType: string;
  operation: string;
  payload: any;
  clientIdempotencyKey: string;
  timestamp: number;
  attempts: number;
  lastError?: string;
  lastAttemptAt?: number;
}

const DB_NAME = 'serveiq-offline';
const DB_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private db: IDBDatabase | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.openDb();
  }

  private openDb(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const stores = ['menu', 'tables', 'tabs', 'orders', 'bills', 'sync_queue'];
        for (const name of stores) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id' });
            if (name === 'sync_queue') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (name === 'orders') {
              store.createIndex('tab_id', 'tab_id', { unique: false });
            }
            if (name === 'bills') {
              store.createIndex('tab_id', 'tab_id', { unique: false });
            }
          }
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => {
        console.warn('Offline cache unavailable');
        resolve();
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore | null> {
    await this.ready;
    if (!this.db) return null;
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async cacheAll<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    for (const item of items) {
      store.put(item);
    }
  }

  getCached<T>(storeName: string): Observable<T[]> {
    return from(this.getAll<T>(storeName));
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    if (!store) return [];
    return new Promise<T[]>((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  getById<T>(storeName: string, id: string): Observable<T | null> {
    return from(this.getOne<T>(storeName, id));
  }

  private async getOne<T>(storeName: string, id: string): Promise<T | null> {
    const store = await this.getStore(storeName);
    if (!store) return null;
    return new Promise<T | null>((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  }

  getByIndex<T>(storeName: string, indexName: string, value: string): Observable<T[]> {
    return from(this.getIndexed<T>(storeName, indexName, value));
  }

  private async getIndexed<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    if (!store) return [];
    return new Promise<T[]>((resolve) => {
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  async upsert<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.put(item);
  }

  async remove(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.delete(id);
  }

  async clearStore(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.clear();
  }

  async queueMutation(entry: SyncQueueEntry): Promise<void> {
    const store = await this.getStore('sync_queue', 'readwrite');
    if (!store) return;
    store.put(entry);
  }

  getPendingMutations(): Observable<SyncQueueEntry[]> {
    return from(this.pending());
  }

  private async pending(): Promise<SyncQueueEntry[]> {
    const store = await this.getStore('sync_queue');
    if (!store) return [];
    return new Promise<SyncQueueEntry[]>((resolve) => {
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'next');
      const results: SyncQueueEntry[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => resolve([]);
    });
  }

  async removeMutation(id: string): Promise<void> {
    await this.remove('sync_queue', id);
  }

  async updateMutation(id: string, updates: Partial<SyncQueueEntry>): Promise<void> {
    const entry = await this.getOne<SyncQueueEntry>('sync_queue', id);
    if (!entry) return;
    Object.assign(entry, updates);
    await this.upsert('sync_queue', entry);
  }

  async clearAll(): Promise<void> {
    for (const name of ['menu', 'tables', 'tabs', 'orders', 'bills', 'sync_queue']) {
      await this.clearStore(name);
    }
  }
}
