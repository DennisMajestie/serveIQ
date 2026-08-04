import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';
import { OfflineSyncEngine, OfflineCacheService, ENVIRONMENT_CONFIG } from '@serveiq/shared/data-access';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, OfflineBannerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'waiter';
  private http = inject(HttpClient);
  private cache = inject(OfflineCacheService);
  private env = inject(ENVIRONMENT_CONFIG);

  async ngOnInit() {
    if ('fonts' in document) {
      (document as any).fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    } else {
      setTimeout(() => {
        document.body.classList.add('fonts-loaded');
      }, 300);
    }
    await this.bootstrapOfflineCache();
  }

  private async bootstrapOfflineCache(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<any>(`${this.env.apiUrl}/api/v1/sync/full`));
      const data = res?.data ?? res;
      if (data) {
        this.cache.cacheAll('menu', data.menus ?? []);
        this.cache.cacheAll('tables', data.tables ?? []);
        this.cache.cacheAll('tabs', data.tabs ?? []);
        this.cache.cacheAll('orders', data.orders ?? []);
        this.cache.cacheAll('bills', data.bills ?? []);
      }
    } catch {
      console.log('Offline bootstrap unavailable — using cached data');
    }
  }
}
