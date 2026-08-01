import { Injectable } from '@angular/core';
import { Observable, from, Subject } from 'rxjs';

export interface SyncQueueEntry {
  id: string;
  entityType: string;
  operation: string;
  payload: any;
  clientIdempotencyKey: string;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

const DB_NAME = 'serveiq-offline';
const DB_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private db: IDBDatabase | null = null;
  private ready$ = new Subject<void>();

  constructor() {
    this.openDb();
  }

  private openDb(): void {
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
      this.ready$.next();
    };
    request.onerror = () => {
      console.warn('Offline cache unavailable');
    };
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore | null {
    if (!this.db) return null;
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  cacheAll<T extends { id: string }>(storeName: string, items: T[]): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    for (const item of items) {
      store.put(item);
    }
  }

  getCached<T>(storeName: string): Observable<T[]> {
    return from(new Promise<T[]>((resolve) => {
      const store = this.getStore(storeName);
      if (!store) { resolve([]); return; }
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    }));
  }

  getById<T>(storeName: string, id: string): Observable<T | null> {
    return from(new Promise<T | null>((resolve) => {
      const store = this.getStore(storeName);
      if (!store) { resolve(null); return; }
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    }));
  }

  getByIndex<T>(storeName: string, indexName: string, value: string): Observable<T[]> {
    return from(new Promise<T[]>((resolve) => {
      const store = this.getStore(storeName);
      if (!store) { resolve([]); return; }
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    }));
  }

  upsert<T extends { id: string }>(storeName: string, item: T): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.put(item);
  }

  remove(storeName: string, id: string): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.delete(id);
  }

  clearStore(storeName: string): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.clear();
  }

  queueMutation(entry: SyncQueueEntry): void {
    const store = this.getStore('sync_queue', 'readwrite');
    if (!store) return;
    store.put(entry);
  }

  getPendingMutations(): Observable<SyncQueueEntry[]> {
    return from(new Promise<SyncQueueEntry[]>((resolve) => {
      const store = this.getStore('sync_queue', 'readonly');
      if (!store) { resolve([]); return; }
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
    }));
  }

  removeMutation(id: string): void {
    this.remove('sync_queue', id);
  }

  updateMutation(id: string, updates: Partial<SyncQueueEntry>): void {
    const store = this.getStore('sync_queue', 'readwrite');
    if (!store) return;
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const entry = getReq.result;
      if (entry) {
        Object.assign(entry, updates);
        store.put(entry);
      }
    };
  }

  clearAll(): void {
    for (const name of ['menu', 'tables', 'tabs', 'orders', 'bills', 'sync_queue']) {
      this.clearStore(name);
    }
  }
}
