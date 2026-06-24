import { __decorate, __metadata } from "tslib";
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
let OpenTabComponent = class OpenTabComponent {
    tableName = 'Table X';
    customerName = '';
    numPeople = 1;
    router = inject(Router);
    cancel() {
        // If opened as a modal via router, navigate back
        this.router.navigate(['/tables']);
    }
    confirm() {
        // For now, just navigate to tables
        this.router.navigate(['/tables']);
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], OpenTabComponent.prototype, "tableName", void 0);
OpenTabComponent = __decorate([
    Component({
        selector: 'app-open-tab',
        standalone: true,
        imports: [CommonModule, FormsModule],
        templateUrl: './open-tab.component.html',
        styleUrls: ['./open-tab.component.scss']
    })
], OpenTabComponent);
export { OpenTabComponent };
//# sourceMappingURL=open-tab.component.js.map