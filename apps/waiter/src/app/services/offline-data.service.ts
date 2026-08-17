import { Injectable, inject } from '@angular/core';
import { Observable, from, of, forkJoin, firstValueFrom } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import {
  OfflineCacheService,
  OfflineSyncEngine,
  NetworkService,
  TablesApiService,
  TabsApiService,
  MenuApiService,
  OrdersApiService,
  BillsApiService,
} from '@serveiq/shared/data-access';
import { Tab, Table, MenuItem, OrderItem, Bill } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class OfflineDataService {
  private cache = inject(OfflineCacheService);
  private syncEngine = inject(OfflineSyncEngine);
  private network = inject(NetworkService);

  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private menuApi = inject(MenuApiService);
  private ordersApi = inject(OrdersApiService);
  private billsApi = inject(BillsApiService);

  getTables(): Observable<Table[]> {
    const cache$ = this.cache.getCached<Table>('tables');
    if (!this.network.isOnline()) return cache$;
    return this.tablesApi.getAllTables().pipe(
      tap(tables => this.cache.cacheAll('tables', tables)),
      catchError(() => cache$),
    );
  }

  getTable(id: string): Observable<Table | null> {
    const cache$ = this.cache.getById<Table>('tables', id);
    if (!this.network.isOnline()) return cache$;
    return this.tablesApi.getTable(id).pipe(
      tap(table => { if (table) this.cache.upsert('tables', table); }),
      catchError(() => cache$),
    );
  }

  getMenu(): Observable<MenuItem[]> {
    const cache$ = this.cache.getCached<MenuItem>('menu');
    if (!this.network.isOnline()) return cache$;
    return this.menuApi.getAllItems().pipe(
      tap(items => this.cache.cacheAll('menu', items)),
      catchError(() => cache$),
    );
  }

  getActiveTabs(): Observable<Tab[]> {
    const cache$ = this.cache.getCached<Tab>('tabs').pipe(
      map(tabs =>
        tabs.filter(t => t.status === 'open' || t.status === 'billed'),
      ),
    );
    if (!this.network.isOnline()) return cache$;
    return this.tabsApi.getAllTabs({ status: 'open,billed' }).pipe(
      tap(tabs => this.cache.cacheAll('tabs', tabs)),
      catchError(() => cache$),
    );
  }

  getTab(id: string): Observable<Tab | null> {
    const cache$ = this.cache.getById<Tab>('tabs', id);
    if (!this.network.isOnline()) return cache$;
    return this.tabsApi.getTab(id).pipe(
      tap(tab => { if (tab) this.cache.upsert('tabs', tab); }),
      catchError(() => cache$),
    );
  }

  getOrdersByTab(tabId: string): Observable<OrderItem[]> {
    const cache$ = this.cache.getByIndex<OrderItem>('orders', 'tab_id', tabId);
    if (!this.network.isOnline()) return cache$;
    return this.ordersApi.getByTab(tabId).pipe(
      tap(orders => this.cache.cacheAll('orders', orders)),
      catchError(() => cache$),
    );
  }

  getBill(tabId: string): Observable<Bill | null> {
    const cache$ = this.cache.getByIndex<Bill>('bills', 'tab_id', tabId).pipe(
      map(bills => {
        const sorted = [...(bills || [])].sort((a, b) =>
          (new Date((b as any).createdAt ?? 0) as any) - (new Date((a as any).createdAt ?? 0) as any));
        return sorted.length > 0 ? sorted[0] : null;
      }),
    );
    if (!this.network.isOnline()) return cache$;
    return this.billsApi.getReceipt(tabId).pipe(
      map(receipt => receipt?.bill ?? null),
      tap(bill => { if (bill) this.cache.upsert('bills', { ...bill, tab_id: (bill as any).tab_id ?? (bill as any).tabId }); }),
      catchError(() => cache$),
    );
  }

  async openTab(request: any): Promise<any> {
    if (!this.network.isOnline()) {
      const tempId = crypto.randomUUID();
      const waiterId = localStorage.getItem('userId') ?? undefined;
      const branchId = localStorage.getItem('branchId') ?? undefined;
      const payload = { ...request, id: tempId, waiter_id: waiterId, branch_id: branchId, status: 'open' };
      await this.syncEngine.queueMutation('tab', 'create', payload);
      this.cache.upsert('tabs', payload as any);
      return { id: tempId, offline: true };
    }
    const result = await this.tabsApi.createTab(request).toPromise();
    if (result) this.cache.upsert('tabs', result);
    return result;
  }

  async addOrderItems(tabId: string, items: any[]): Promise<any> {
    if (!this.network.isOnline()) {
      const waiterId = localStorage.getItem('userId') ?? '';
      const results = [];
      for (const item of items) {
        const menuItem = await firstValueFrom(this.cache.getById<any>('menu', item.menu_item_id));
        const unitPriceKobo = menuItem?.priceKobo ?? menuItem?.price_kobo ?? 0;
        const modifierTotal = (item.modifiers || []).reduce((s: number, m: any) => s + (m.price_kobo * m.qty), 0);
        const orderId = crypto.randomUUID();
        // Instant (ready-to-serve) items — e.g. drinks — sync straight into
        // "ready_for_pickup" so they can be served immediately; everything else
        // keeps the legacy APPROVED semantics used by the offline path.
        const orderStatus =
          (menuItem?.prepType ?? menuItem?.prep_type) === 'instant'
            ? 'READY_FOR_PICKUP'
            : 'APPROVED';
        const payload = {
          id: orderId,
          tab_id: tabId,
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          unit_price_kobo: unitPriceKobo,
          subtotal_kobo: (item.quantity * unitPriceKobo) + modifierTotal,
          round_number: item.round_number ?? 1,
          created_by: waiterId,
          notes: item.notes,
          modifiers: item.modifiers || null,
          order_status: orderStatus,
        };
        await this.syncEngine.queueMutation('order', 'create', payload);
        this.cache.upsert('orders', payload as any);
        results.push({
          id: orderId,
          offline: true,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.name,
          quantity: item.quantity,
          unit_price_kobo: unitPriceKobo,
          subtotal_kobo: (item.quantity * unitPriceKobo) + modifierTotal,
          order_status: orderStatus,
        });
      }
      return results;
    }
    const result = await this.ordersApi.addItems(tabId, items).toPromise();
    if (result) this.cache.cacheAll('orders', result);
    return result;
  }

  async closeTab(tabId: string): Promise<any> {
    if (!this.network.isOnline()) {
      await this.syncEngine.queueMutation('tab', 'update', { id: tabId, status: 'paid' });
      this.cache.upsert('tabs', { id: tabId, status: 'paid' });
      return { offline: true };
    }
    const result = await this.tabsApi.closeTab(tabId).toPromise();
    if (result) this.cache.upsert('tabs', result);
    return result;
  }

  async generateBill(tabId: string, options?: any): Promise<any> {
    if (!this.network.isOnline()) {
      const billId = crypto.randomUUID();
      await this.syncEngine.queueMutation('bill', 'create', { id: billId, tab_id: tabId, ...options });
      return { id: billId, tab_id: tabId, offline: true };
    }
    const result = await this.billsApi.generate(tabId, options).toPromise();
    if (result) this.cache.upsert('bills', result);
    return result;
  }

  async recordPayment(tabId: string, payment: any): Promise<any> {
    if (!this.network.isOnline()) {
      await this.syncEngine.queueMutation('bill', 'pay', { tab_id: tabId, ...payment });
      return { offline: true };
    }
    const result = await this.billsApi.recordPayment(tabId, payment).toPromise();
    if (result) this.cache.upsert('bills', result);
    return result;
  }

  async deleteOrderItem(orderId: string): Promise<any> {
    if (!this.network.isOnline()) {
      await this.syncEngine.queueMutation('order', 'delete', { id: orderId });
      this.cache.remove('orders', orderId);
      return { offline: true };
    }
    const result = await this.ordersApi.cancelOrder(orderId, 'Removed by waiter').toPromise();
    this.cache.remove('orders', orderId);
    return result;
  }
}
