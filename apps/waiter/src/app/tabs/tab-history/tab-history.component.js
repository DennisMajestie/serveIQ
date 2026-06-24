import { __decorate } from "tslib";
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService } from "../../../../../../libs/shared/data-access/src/index.ts";
let TabHistoryComponent = class TabHistoryComponent {
    router = inject(Router);
    tabsApi = inject(TabsApiService);
    isLoading = signal(true);
    closedTabs = signal([]);
    currentDate = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric' });
    transactions = computed(() => {
        const tabs = this.closedTabs();
        if (!Array.isArray(tabs))
            return [];
        return tabs.map(t => ({
            id: t.id,
            table: t.tableId ?? '—',
            customer: t.customerName ?? 'Walk-in',
            status: t.status === 'paid' ? 'Paid' : t.status === 'voided' ? 'Voided' : t.status,
            statusIcon: t.status === 'paid' ? 'check_circle' : t.status === 'voided' ? 'cancel' : 'help',
            amount: t.totalKobo ?? 0,
            method: t.paymentMethod ?? 'Cash'
        }));
    });
    transactionsCount = computed(() => this.transactions().length);
    shiftTotal = computed(() => {
        const txns = this.transactions();
        return Array.isArray(txns) ? txns.reduce((sum, t) => sum + t.amount, 0) / 100 : 0;
    });
    ngOnInit() {
        this.tabsApi.getAllTabs().subscribe({
            next: (tabs) => {
                // Show closed/paid/voided tabs
                const closed = tabs.filter(t => t.status === 'paid' || t.status === 'voided');
                this.closedTabs.set(closed);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
    formatKobo(kobo) {
        return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
    getStatusLabel(tab) {
        return tab.status === 'paid' ? 'Paid' : tab.status === 'voided' ? 'Voided' : tab.status;
    }
    openTransaction(tab) {
        this.router.navigate(['/tabs/receipt', tab.id]);
    }
    openTransactionById(id) {
        const tab = this.closedTabs().find(t => t.id === id);
        if (tab) {
            this.router.navigate(['/tabs/receipt', tab.id]);
        }
    }
    goBack() {
        this.router.navigate(['/tables']);
    }
};
TabHistoryComponent = __decorate([
    Component({
        selector: 'app-tab-history',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './tab-history.component.html',
        styleUrls: ['./tab-history.component.scss']
    })
], TabHistoryComponent);
export { TabHistoryComponent };
//# sourceMappingURL=tab-history.component.js.map