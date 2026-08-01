import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly isOnline = signal(true);

  constructor() {
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }
}
