import { __decorate } from "tslib";
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService } from "../../../../../libs/shared/data-access/src/index.ts";
let SettingsComponent = class SettingsComponent {
    branchesApi = inject(BranchesApiService);
    branches = signal([]);
    isLoading = signal(true);
    copiedBranchId = signal(null);
    ngOnInit() {
        this.branchesApi.list().subscribe({
            next: (b) => { this.branches.set(b); this.isLoading.set(false); },
            error: () => this.isLoading.set(false)
        });
    }
    copyBranchId(branchId) {
        navigator.clipboard.writeText(branchId);
        this.copiedBranchId.set(branchId);
        setTimeout(() => this.copiedBranchId.set(null), 2000);
    }
    isCopied(branchId) {
        return this.copiedBranchId() === branchId;
    }
};
SettingsComponent = __decorate([
    Component({
        selector: 'app-settings',
        standalone: true,
        imports: [CommonModule, FormsModule],
        templateUrl: './settings.component.html',
        styleUrls: ['./settings.component.scss']
    })
], SettingsComponent);
export { SettingsComponent };
//# sourceMappingURL=settings.component.js.map