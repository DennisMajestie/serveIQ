import { signal, computed, Injectable } from '@angular/core';
import { Tab, Table, MenuItem } from '@serveiq/models';

@Injectable({
  providedIn: 'root'
})
export class SyncStore {
  // State
  private _tabs = signal<Tab[]>([]);
  private _tables = signal<Table[]>([]);
  private _menu = signal<MenuItem[]>([]);
  
  // Selectors
  readonly tabs = this._tabs.asReadonly();
  readonly tables = this._tables.asReadonly();
  readonly menu = this._menu.asReadonly();
  
  readonly openTabs = computed(() => this._tabs().filter(t => t.status === 'open'));
  readonly occupiedTables = computed(() => this._tables().filter(t => t.status === 'occupied'));
  
  // Actions
  setTabs(tabs: Tab[]) {
    this._tabs.set(tabs);
  }

  setTables(tables: Table[]) {
    this._tables.set(tables);
  }

  setMenu(menu: MenuItem[]) {
    this._menu.set(menu);
  }

  updateTab(tabId: string, updates: Partial<Tab>) {
    this._tabs.update(tabs => tabs.map(t => t.id === tabId ? { ...t, ...updates } : t));
  }

  addTab(tab: Tab) {
    this._tabs.update(tabs => [...tabs, tab]);
  }
}
