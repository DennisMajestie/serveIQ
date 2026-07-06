import { Injectable } from '@angular/core';
import { Observable, from, Subject } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private dbName = 'serveiq-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private ready$ = new Subject<void>();

  constructor() {
    this.openDb();
  }

  private openDb(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('menu')) {
        db.createObjectStore('menu', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tables')) {
        db.createObjectStore('tables', { keyPath: 'id' });
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

  cacheData<T>(storeName: string, items: T[]): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    items.forEach(item => {
      store.put({ data: item, timestamp: Date.now() });
    });
  }

  getCached<T>(storeName: string): Observable<T[]> {
    return from(new Promise<T[]>((resolve) => {
      const store = this.getStore(storeName);
      if (!store) { resolve([]); return; }
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.map((entry: CacheEntry<T>) => entry.data));
      request.onerror = () => resolve([]);
    }));
  }

  clearCache(storeName: string): void {
    const store = this.getStore(storeName, 'readwrite');
    if (!store) return;
    store.clear();
  }

  clearAll(): void {
    this.clearCache('menu');
    this.clearCache('tables');
  }
}
