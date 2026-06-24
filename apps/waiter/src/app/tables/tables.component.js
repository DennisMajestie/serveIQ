import { __decorate } from "tslib";
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService } from "../../../../../libs/shared/data-access/src/index.ts";
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
let TablesComponent = class TablesComponent {
    tablesApi = inject(TablesApiService);
    tabsApi = inject(TabsApiService);
    router = inject(Router);
    branchName = 'Main Dining Room';
    isSynced = signal(false);
    isLoading = signal(true);
    tables = signal([]);
    openTabs = signal([]);
    stats = computed(() => {
        const t = this.tables();
        return {
            totalTables: t.length,
            available: t.filter(x => x.status === 'available').length,
            occupied: t.filter(x => x.status === 'occupied').length
        };
    });
    pollSub;
    ngOnInit() {
        this.loadTables();
        // Poll every 5 seconds for live updates
        this.pollSub = interval(5000).pipe(switchMap(() => this.tablesApi.getAllTables())).subscribe(tables => {
            this.tables.set(tables);
            this.isSynced.set(true);
        });
    }
    ngOnDestroy() {
        this.pollSub?.unsubscribe();
    }
    loadTables() {
        this.tablesApi.getAllTables().subscribe({
            next: (tables) => {
                this.tables.set(tables);
                this.isLoading.set(false);
                this.isSynced.set(true);
            },
            error: () => this.isLoading.set(false)
        });
    }
    getStatusColor(status) {
        switch (status) {
            case 'occupied': return '#EF4444';
            case 'available': return '#22C55E';
            case 'reserved': return '#EAB308';
            default: return '#94a3b8';
        }
    }
    getStatusClass(status) {
        return status.toLowerCase();
    }
    async onTableClick(table) {
        if (table.status === 'available') {
            // Navigate to open a new tab
            await this.router.navigate(['/tabs/detail', table.id]);
        }
        else {
            // Navigate to existing tab
            const openTab = this.openTabs().find(t => t.tableId === table.id);
            if (openTab) {
                await this.router.navigate(['/tabs/detail', openTab.id]);
            }
            else {
                await this.router.navigate(['/tabs/detail', table.id]);
            }
        }
    }
    async onSeatTable(table) {
        await this.router.navigate(['/tabs/detail', table.id]);
    }
};
TablesComponent = __decorate([
    Component({
        selector: 'app-tables',
        standalone: true,
        imports: [CommonModule, RouterModule],
        templateUrl: './tables.component.html',
        styleUrls: ['./tables.component.scss']
    })
], TablesComponent);
export { TablesComponent };
//# sourceMappingURL=tables.component.js.map