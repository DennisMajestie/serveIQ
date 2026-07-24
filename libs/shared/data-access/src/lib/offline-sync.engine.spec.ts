import { OfflineSyncEngine } from './offline-sync.engine';

describe('OfflineSyncEngine', () => {
  let engine: OfflineSyncEngine;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => localStorageMock[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { localStorageMock[key] = value; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete localStorageMock[key]; });
    window.addEventListener = vi.fn();
    engine = new OfflineSyncEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the engine', () => {
    expect(engine).toBeTruthy();
  });

  it('should queue a mutation', () => {
    engine.queueMutation({ type: 'CREATE_ORDER', payload: { id: '1' } });
    const stored = JSON.parse(localStorageMock['offline_sync_queue']);
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe('CREATE_ORDER');
  });

  it('should persist queue to localStorage', () => {
    engine.queueMutation({ type: 'UPDATE_ORDER', payload: { id: '2' } });
    engine.queueMutation({ type: 'DELETE_ORDER', payload: { id: '3' } });
    const stored = JSON.parse(localStorageMock['offline_sync_queue']);
    expect(stored).toHaveLength(2);
  });

  it('should restore queue from localStorage on init', () => {
    localStorageMock['offline_sync_queue'] = JSON.stringify([
      { id: 'existing', type: 'CREATE_ORDER', payload: {}, timestamp: Date.now() },
    ]);
    const restored = new OfflineSyncEngine();
    expect((restored as any).syncQueue).toHaveLength(1);
  });

  it('should recover from corrupted localStorage', () => {
    localStorageMock['offline_sync_queue'] = 'not-valid-json';
    const corrupted = new OfflineSyncEngine();
    expect((corrupted as any).syncQueue).toEqual([]);
  });

  it('should process sync queue successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    engine.queueMutation({ type: 'CREATE_ORDER', payload: { url: '/api/v1/orders', data: {} } });
    await engine.processSync();
    expect((engine as any).syncQueue).toHaveLength(0);
  });

  it('should re-queue on failed sync', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    engine.queueMutation({ type: 'CREATE_ORDER', payload: { url: '/api/v1/orders', data: {} } });
    await engine.processSync();
    expect((engine as any).syncQueue).toHaveLength(1);
  });

  it('should not process if already processing', async () => {
    (engine as any).processing = true;
    engine.queueMutation({ type: 'CREATE_ORDER', payload: { id: '1' } });
    await engine.processSync();
    expect((engine as any).syncQueue).toHaveLength(1);
  });

  it('should assign unique IDs to each mutation', () => {
    const id1 = (engine as any).syncQueue[0]?.id;
    engine.queueMutation({ type: 'A', payload: {} });
    engine.queueMutation({ type: 'B', payload: {} });
    const ids = (engine as any).syncQueue.map((m: any) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
