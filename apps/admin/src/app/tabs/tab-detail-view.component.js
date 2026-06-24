import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
let TabDetailViewComponent = class TabDetailViewComponent {
    orderItems = [
        {
            name: 'Spicy Suya',
            notes: 'Extra onions, hot spice',
            qty: 2,
            unitPrice: 3500,
            icon: 'lunch_dining'
        },
        {
            name: 'Jollof Rice Special',
            notes: 'With fried plantain',
            qty: 1,
            unitPrice: 5500,
            icon: 'ramen_dining'
        },
        {
            name: 'Chapman',
            notes: 'Classic chilled',
            qty: 3,
            unitPrice: 2000,
            icon: 'local_bar'
        }
    ];
    subtotal = 18500;
    vatRate = 0.075;
    serviceChargeRate = 0;
    get vat() {
        return this.subtotal * this.vatRate;
    }
    get serviceCharge() {
        return this.subtotal * this.serviceChargeRate;
    }
    get total() {
        return this.subtotal + this.vat + this.serviceCharge;
    }
};
TabDetailViewComponent = __decorate([
    Component({
        selector: 'app-tab-detail',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './tab-detail-view.component.html',
        styleUrls: ['./tab-detail-view.component.scss']
    })
], TabDetailViewComponent);
export { TabDetailViewComponent };
//# sourceMappingURL=tab-detail-view.component.js.map