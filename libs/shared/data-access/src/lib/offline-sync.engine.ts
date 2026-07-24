import { Injectable } from '@angular/core';

const STORAGE_KEY = 'offline_sync_queue';

interface SyncMutation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncEngine {
  private syncQueue: SyncMutation[] = [];
  private processing = false;

  constructor() {
    this.loadFromStorage();
    window.addEventListener('online', () => this.processSync());
  }

  async queueMutation(mutation: { type: string; payload: any }) {
    const entry: SyncMutation = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      type: mutation.type,
      payload: mutation.payload,
      timestamp: Date.now(),
    };
    this.syncQueue.push(entry);
    this.persistToStorage();
  }

  async processSync() {
    if (this.processing || this.syncQueue.length === 0) return;
    this.processing = true;

    try {
      const batch = [...this.syncQueue];
      this.syncQueue = [];
      this.persistToStorage();

      for (const mutation of batch) {
        try {
          const response = await fetch(mutation.payload.url || '/api/v1/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mutation.payload),
          });
          if (!response.ok) {
            this.syncQueue.push(mutation);
          }
        } catch {
          this.syncQueue.push(mutation);
        }
      }

      this.persistToStorage();
    } finally {
      this.processing = false;
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch {
      this.syncQueue = [];
    }
  }

  private persistToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch {
      console.warn('Failed to persist sync queue to localStorage');
    }
  }
}
