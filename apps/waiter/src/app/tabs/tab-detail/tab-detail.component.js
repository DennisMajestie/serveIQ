import { __decorate } from "tslib";
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, OrdersApiService, MenuApiService } from "../../../../../../libs/shared/data-access/src/index.ts";
import Swal from 'sweetalert2';
let TabDetailComponent = class TabDetailComponent {
    route = inject(ActivatedRoute);
    router = inject(Router);
    tabService = inject(TabsApiService);
    orderService = inject(OrdersApiService);
    menuService = inject(MenuApiService);
    tabId = signal('');
    tab = signal(null);
    items = signal([]);
    isLoading = signal(true);
    menuItems = [];
    subtotal = computed(() => {
        const items = this.items();
        return Array.isArray(items) ? items.reduce((sum, i) => sum + (i.priceKobo * i.quantity), 0) : 0;
    });
    vat = computed(() => Math.round(this.subtotal() * 0.075));
    total = computed(() => this.subtotal() + this.vat());
    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.tabId.set(id);
                this.loadTab(id);
            }
        });
    }
    loadTab(id) {
        this.tabService.getTab(id).subscribe({
            next: (tab) => {
                this.tab.set(tab);
                this.loadOrders(id);
            },
            error: () => {
                // If no existing tab, treat id as tableId and load orders empty
                this.isLoading.set(false);
            }
        });
    }
    loadOrders(tabId) {
        this.orderService.getByTab(tabId).subscribe({
            next: (items) => { this.items.set(items); this.isLoading.set(false); },
            error: () => this.isLoading.set(false)
        });
    }
    removeItem(item) {
        Swal.fire({
            title: 'Remove item?',
            text: `Remove ${item.menuItemName} from the tab?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Remove'
        }).then(result => {
            if (result.isConfirmed) {
                this.orderService.deleteItem(item.id).subscribe(() => this.items.update(is => is.filter(i => i.id !== item.id)));
            }
        });
    }
    addItem() {
        this.menuService.getAllItems().subscribe({
            next: (items) => {
                this.menuItems = items;
                this.openAddOrderDialog();
            },
            error: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load menu items'
                });
            }
        });
    }
    openAddOrderDialog() {
        Swal.fire({
            title: 'Add Order Item',
            html: `
        <select id="swal-menu-item" class="swal2-input">
          <option value="">Select menu item</option>
        </select>
        <input id="swal-quantity" class="swal2-input" type="number" min="1" value="1" placeholder="Quantity">
        <input id="swal-notes" class="swal2-input" placeholder="Notes (optional)">
      `,
            confirmButtonText: 'Add Item',
            confirmButtonColor: '#F97316',
            showCancelButton: true,
            preConfirm: () => {
                const menuItemId = document.getElementById('swal-menu-item').value;
                const quantity = Number(document.getElementById('swal-quantity').value);
                const notes = document.getElementById('swal-notes').value;
                if (!menuItemId) {
                    Swal.showValidationMessage('Please select a menu item');
                    return;
                }
                return { menuItemId, quantity, notes };
            }
        }).then(result => {
            if (result.isConfirmed && result.value) {
                this.orderService.addItems(this.tabId(), [result.value]).subscribe({
                    next: () => {
                        this.loadOrders(this.tabId());
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Order item added successfully',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    },
                    error: () => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to add order item'
                        });
                    }
                });
            }
        });
    }
    goBack() {
        this.router.navigate(['/tables']);
    }
    viewBill() {
        this.router.navigate(['/tabs/bill', this.tabId()]);
    }
    closeTab() {
        Swal.fire({
            title: 'Close Tab?',
            text: `Are you sure you want to close this tab? This will generate a bill.`, icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F97316',
            confirmButtonText: 'Close Tab'
        }).then(result => {
            if (result.isConfirmed) {
                this.tabService.closeTab(this.tabId()).subscribe({
                    next: (_result) => {
                        this.router.navigate(['/tabs/bill', this.tabId()]);
                    },
                    error: (err) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to close tab'
                        });
                    }
                });
            }
        });
    }
    formatKobo(kobo) {
        return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
};
TabDetailComponent = __decorate([
    Component({
        selector: 'app-tab-detail',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './tab-detail.component.html',
        styleUrls: ['./tab-detail.component.scss']
    })
], TabDetailComponent);
export { TabDetailComponent };
//# sourceMappingURL=tab-detail.component.js.map