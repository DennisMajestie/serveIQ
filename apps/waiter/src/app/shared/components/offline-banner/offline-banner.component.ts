import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '@serveiq/shared/data-access';
import { OfflineSyncEngine } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!network.isOnline()) {
      <div class="offline-banner">
        <span>You are offline — changes will sync when connected</span>
      </div>
    }
    @if (sync.pendingCount() > 0 && network.isOnline()) {
      <div class="sync-banner" (click)="sync.processSync()">
        <span>{{ sync.pendingCount() }} pending change{{ sync.pendingCount() !== 1 ? 's' : '' }} — tap to sync now</span>
      </div>
    }
    @if (sync.lastSyncError()) {
      <div class="sync-error-banner">
        <span>Sync error: {{ sync.lastSyncError() }}</span>
      </div>
    }
  `,
  styles: [`
    .offline-banner { background: #f97316; color: white; text-align: center; padding: 8px 16px; font-size: 14px; font-weight: 500; }
    .sync-banner { background: #3b82f6; color: white; text-align: center; padding: 8px 16px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .sync-error-banner { background: #ef4444; color: white; text-align: center; padding: 8px 16px; font-size: 14px; font-weight: 500; }
  `]
})
export class OfflineBannerComponent {
  protected network = inject(NetworkService);
  protected sync = inject(OfflineSyncEngine);
}
