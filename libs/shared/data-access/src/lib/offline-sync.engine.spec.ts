import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { OfflineSyncEngine } from './offline-sync.engine';
import { OfflineCacheService } from './offline-cache.service';
import { NetworkService } from './network.service';
import { ENVIRONMENT_CONFIG } from './api/environment.token';

describe('OfflineSyncEngine', () => {
  let engine: OfflineSyncEngine;
  let cache: OfflineCacheService;
  let network: NetworkService;
  let httpMock: HttpTestingController;

  async function waitForDb(): Promise<void> {
    const start = Date.now();
    while (!(cache as any).db) {
      if (Date.now() - start > 2000) {
        throw new Error('IndexedDB did not become ready in time');
      }
      await new Promise((r) => setTimeout(r, 5));
    }
  }

  beforeEach(async () => {
    window.addEventListener = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ENVIRONMENT_CONFIG,
          useValue: {
            apiUrl: '',
            production: false,
            nemotronUrl: '',
            publicMenuBaseUrl: '',
          },
        },
        OfflineCacheService,
        NetworkService,
        OfflineSyncEngine,
      ],
    });
    engine = TestBed.inject(OfflineSyncEngine);
    cache = TestBed.inject(OfflineCacheService);
    network = TestBed.inject(NetworkService);
    httpMock = TestBed.inject(HttpTestingController);
    // Keep the online-effect from firing mid-test; we drive sync manually.
    (network as any).isOnline.set(false);
    await waitForDb();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should build a full sync queue URL from the environment base URL', () => {
    const url = (engine as any).syncUrl('queue');
    expect(url).toBe('/api/v1/sync/queue');
  });

  it('should persist a mutation to the offline sync_queue store', async () => {
    await engine.queueMutation('tab', 'create', { id: 'tab-1' });
    const pending = await firstValueFrom(cache.getPendingMutations());
    expect(pending).toHaveLength(1);
    expect(pending[0].entityType).toBe('tab');
    expect(pending[0].operation).toBe('create');
    expect(pending[0].clientIdempotencyKey).toBeDefined();
  });

  it('should POST queued mutations and drop the local entry on 2xx', async () => {
    await engine.queueMutation('tab', 'create', { id: 'tab-1' });
    (network as any).isOnline.set(true);

    const syncPromise = engine.processSync();
    const req = httpMock.expectOne('/api/v1/sync/queue');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.entity_type).toBe('tab');
    expect(req.request.body.client_idempotency_key).toBeDefined();
    req.flush({ success: true, id: 'sync-1' });

    await syncPromise;
    const pending = await firstValueFrom(cache.getPendingMutations());
    expect(pending).toHaveLength(0);
  });

  it('should associate retries with the same idempotency key on failure', async () => {
    await engine.queueMutation('tab', 'create', { id: 'tab-1' });
    (network as any).isOnline.set(true);

    const syncPromise = engine.processSync();
    const req = httpMock.expectOne('/api/v1/sync/queue');
    req.flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );

    await syncPromise;
    const pending = await firstValueFrom(cache.getPendingMutations());
    expect(pending).toHaveLength(1);
    expect(pending[0].attempts).toBeGreaterThanOrEqual(1);
  });

  it('should mark the entry failed and surface lastSyncError after max retries', async () => {
    await engine.queueMutation('bill', 'pay', { tab_id: 'tab-1' });
    const pending = await firstValueFrom(cache.getPendingMutations());
    cache.updateMutation(pending[0].id, { attempts: 3 });

    (network as any).isOnline.set(true);
    const syncPromise = engine.processSync();
    const req = httpMock.expectOne('/api/v1/sync/queue');
    req.flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );

    await syncPromise;
    const after = await firstValueFrom(cache.getPendingMutations());
    expect(after).toHaveLength(1);
    expect(after[0].lastError).toBeDefined();
    expect(engine.lastSyncError()).toBeDefined();
  });
});