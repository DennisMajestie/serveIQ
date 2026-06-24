import { __decorate } from "tslib";
import { signal, computed, Injectable } from '@angular/core';
let SyncStore = class SyncStore {
    // State
    _tabs = signal([]);
    _tables = signal([]);
    _menu = signal([]);
    // Selectors
    tabs = this._tabs.asReadonly();
    tables = this._tables.asReadonly();
    menu = this._menu.asReadonly();
    openTabs = computed(() => this._tabs().filter(t => t.status === 'open'));
    occupiedTables = computed(() => this._tables().filter(t => t.status === 'occupied'));
    // Actions
    setTabs(tabs) {
        this._tabs.set(tabs);
    }
    setTables(tables) {
        this._tables.set(tables);
    }
    setMenu(menu) {
        this._menu.set(menu);
    }
    updateTab(tabId, updates) {
        this._tabs.update(tabs => tabs.map(t => t.id === tabId ? { ...t, ...updates } : t));
    }
    addTab(tab) {
        this._tabs.update(tabs => [...tabs, tab]);
    }
};
SyncStore = __decorate([
    Injectable({
        providedIn: 'root'
    })
], SyncStore);
export { SyncStore };
//# sourceMappingURL=sync.store.js.map