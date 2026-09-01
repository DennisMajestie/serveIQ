import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { AuthService, ENVIRONMENT_CONFIG, OfflineCacheService, OfflineSyncEngine } from '@serveiq/shared/data-access';
import { OfflineDataService } from './services/offline-data.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NxWelcome],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: false, token$: null as any } },
        { provide: ENVIRONMENT_CONFIG, useValue: { apiUrl: 'http://test' } },
        { provide: HttpClient, useValue: { get: () => of({}) } },
        {
          provide: OfflineDataService,
          useValue: { getTables: () => of([]) },
        },
        {
          provide: OfflineCacheService,
          useValue: { cacheAll: () => {}, getPendingMutations: () => [] },
        },
        {
          provide: OfflineSyncEngine,
          useValue: { pendingCount: () => 0, lastSyncError: () => null, processSync: () => {} },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
