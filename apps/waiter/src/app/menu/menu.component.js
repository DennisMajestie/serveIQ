import { __decorate } from "tslib";
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuApiService } from "../../../../../libs/shared/data-access/src/index.ts";
let MenuComponent = class MenuComponent {
    router = inject(Router);
    route = inject(ActivatedRoute);
    menuApi = inject(MenuApiService);
    selectedCategory = 'All';
    categories = signal(['All']);
    tableId = null;
    tabId = null;
    isLoading = signal(true);
    menuItems = [];
    selectedItems = [];
    selectedPortions = new Map();
    ngOnInit() {
        this.tableId = this.route.snapshot.queryParamMap.get('tableId');
        this.tabId = this.route.snapshot.queryParamMap.get('tabId');
        this.menuApi.getAllItems().subscribe({
            next: (items) => {
                if (!Array.isArray(items)) {
                    this.isLoading.set(false);
                    return;
                }
                this.menuItems = items.map(i => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    image: i.imageUrl || '/assets/food/placeholder.png',
                    price: i.priceKobo / 100
                }));
                const cats = ['All', ...new Set(items.map(i => i.category))];
                this.categories.set(cats);
                this.selectedCategory = cats[0] ?? 'All';
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
    get filteredItems() {
        return this.selectedCategory === 'All'
            ? this.menuItems
            : this.menuItems.filter(i => i.category === this.selectedCategory);
    }
    get selectionTotal() {
        if (!Array.isArray(this.selectedItems))
            return 0;
        return this.selectedItems.reduce((sum, item) => {
            const price = item.portionPrice ?? item.price;
            return sum + (price * item.qty);
        }, 0);
    }
    getItemQty(itemId) {
        return this.selectedItems.find(i => i.id === itemId)?.qty ?? 0;
    }
    getSelectedPortion(itemId) {
        return this.selectedPortions.get(itemId) ?? '';
    }
    setSelectedPortion(itemId, portionId) {
        this.selectedPortions.set(itemId, portionId);
    }
    getPortionPrice(item, portionId) {
        return item.portions?.find(p => p.id === portionId)?.price ?? item.price;
    }
    getDisplayPrice(item) {
        const pid = this.getSelectedPortion(item.id);
        return pid ? this.getPortionPrice(item, pid) : item.price;
    }
    addToSelection(item) {
        const pid = item.portions ? this.getSelectedPortion(item.id) : undefined;
        const portion = item.portions?.find(p => p.id === pid);
        const key = item.id + (pid ? `-${pid}` : '');
        const existing = this.selectedItems.find(i => (i.id + (i.selectedPortionId ? `-${i.selectedPortionId}` : '')) === key);
        if (existing) {
            existing.qty++;
        }
        else {
            this.selectedItems.push({ ...item, qty: 1, selectedPortionId: pid, portionName: portion?.name, portionPrice: portion?.price });
        }
    }
    removeFromSelection(itemId, portionId) {
        const key = itemId + (portionId ? `-${portionId}` : '');
        const idx = this.selectedItems.findIndex(i => (i.id + (i.selectedPortionId ? `-${i.selectedPortionId}` : '')) === key);
        if (idx !== -1) {
            this.selectedItems[idx].qty--;
            if (this.selectedItems[idx].qty <= 0)
                this.selectedItems.splice(idx, 1);
        }
    }
    selectCategory(category) {
        this.selectedCategory = category;
    }
    confirmSelection() {
        const targetId = this.tabId || this.tableId;
        if (targetId) {
            this.router.navigate(['/tabs/detail', targetId], { state: { selectedItems: this.selectedItems } });
        }
        else {
            this.router.navigate(['/tables']);
        }
    }
    goToTables() { this.router.navigate(['/tables']); }
    goToHistory() { this.router.navigate(['/tabs/history']); }
    goToProfile() { }
};
MenuComponent = __decorate([
    Component({
        selector: 'app-menu',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './menu.component.html',
        styleUrls: ['./menu.component.scss']
    })
], MenuComponent);
export { MenuComponent };
//# sourceMappingURL=menu.component.js.map