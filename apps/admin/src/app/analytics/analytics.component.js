import { __decorate } from "tslib";
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
let AnalyticsComponent = class AnalyticsComponent {
    kpiMetrics = signal([
        { label: 'Total Revenue', value: '₦4,840k', change: '+12.4%', trend: 'up', icon: 'payments', color: '#00D166' },
        { label: 'Avg Ticket', value: '₦8,450', change: '+5.2%', trend: 'up', icon: 'receipt', color: '#0059bb' },
        { label: 'Turnover Rate', value: '42m', change: '-4m', trend: 'up', icon: 'speed', color: '#8b5cf6' },
        { label: 'Cancel Rate', value: '1.2%', change: '+0.4%', trend: 'down', icon: 'cancel', color: '#FF7043' }
    ]);
    categoryROI = signal([
        { name: 'Food & Entrees', value: '3,240,500', percentage: 65, color: '#00D166' },
        { name: 'Beverages', value: '1,120,000', percentage: 22, color: '#0059bb' },
        { name: 'Desserts', value: '479,500', percentage: 13, color: '#FF7043' }
    ]);
    staffData = signal([
        { name: 'Sarah Miller', role: 'Main Section', sales: 452, efficiency: 94, avatar: '#00D166' },
        { name: 'Marcus Chen', role: 'Patio', sales: 398, efficiency: 88, avatar: '#0059bb' },
        { name: 'Elena Rodriguez', role: 'Bar', sales: 312, efficiency: 91, avatar: '#8b5cf6' }
    ]);
};
AnalyticsComponent = __decorate([
    Component({
        selector: 'app-analytics',
        standalone: true,
        imports: [CommonModule, MatIconModule, RouterModule],
        templateUrl: './analytics.component.html',
        styleUrls: ['./analytics.component.scss']
    })
], AnalyticsComponent);
export { AnalyticsComponent };
//# sourceMappingURL=analytics.component.js.map