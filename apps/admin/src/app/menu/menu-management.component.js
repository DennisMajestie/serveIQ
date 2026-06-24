import { __decorate } from "tslib";
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuApiService, UploadApiService } from "../../../../../libs/shared/data-access/src/index.ts";
let MenuManagementComponent = class MenuManagementComponent {
    menuService = inject(MenuApiService);
    uploadService = inject(UploadApiService);
    selectedCategory = signal('All');
    isLoading = signal(true);
    items = signal([]);
    // Add Item Modal state
    showAddModal = signal(false);
    isSubmitting = signal(false);
    imagePreview = signal(null);
    selectedFile = signal(null);
    formName = signal('');
    formCategory = signal('');
    formPrice = signal(null);
    formUnit = signal('');
    formIsAvailable = signal(true);
    menuItems = computed(() => {
        const cat = this.selectedCategory();
        const items = this.items();
        if (!Array.isArray(items))
            return [];
        return cat === 'All'
            ? items
            : items.filter(i => i.category === cat);
    });
    categories = computed(() => {
        const items = this.items();
        if (!Array.isArray(items))
            return [{ name: 'All', count: 0 }];
        const cats = ['All', ...new Set(items.map(i => i.category))];
        return cats.map(c => ({
            name: c,
            count: c === 'All' ? items.length : items.filter(i => i.category === c).length
        }));
    });
    ngOnInit() {
        this.loadMenu();
    }
    loadMenu() {
        this.isLoading.set(true);
        this.menuService.getAllItems().subscribe({
            next: (items) => {
                this.items.set(items);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }
    selectCategory(name) {
        this.selectedCategory.set(name);
    }
    toggleAvailability(item) {
        this.menuService.updateItem(item.id, { isAvailable: !item.isAvailable })
            .subscribe((updated) => {
            this.items.update(is => is.map(i => i.id === updated.id ? updated : i));
        });
    }
    addItem() {
        this.resetForm();
        this.showAddModal.set(true);
    }
    closeModal() {
        this.showAddModal.set(false);
    }
    onImageSelected(event) {
        const file = event.target.files?.[0];
        if (!file)
            return;
        this.selectedFile.set(file);
        const reader = new FileReader();
        reader.onload = (e) => this.imagePreview.set(e.target?.result);
        reader.readAsDataURL(file);
    }
    async submitItem() {
        const name = this.formName().trim();
        const category = this.formCategory().trim();
        const priceNaira = this.formPrice();
        if (!name || !category || !priceNaira)
            return;
        this.isSubmitting.set(true);
        let imageUrl;
        if (this.selectedFile()) {
            try {
                const uploaded = await this.uploadService.uploadFile(this.selectedFile()).toPromise();
                imageUrl = uploaded?.url;
            }
            catch { /* image upload failed silently — item still created */ }
        }
        const payload = {
            name,
            category,
            price_kobo: Math.round(priceNaira * 100),
            unit: this.formUnit().trim() || undefined,
            is_available: this.formIsAvailable(),
            ...(imageUrl ? { image_url: imageUrl } : {})
        };
        this.menuService.createItem(payload).subscribe({
            next: (item) => {
                this.items.update(is => [...is, item]);
                this.isSubmitting.set(false);
                this.closeModal();
            },
            error: () => this.isSubmitting.set(false)
        });
    }
    resetForm() {
        this.formName.set('');
        this.formCategory.set('');
        this.formPrice.set(null);
        this.formUnit.set('');
        this.formIsAvailable.set(true);
        this.imagePreview.set(null);
        this.selectedFile.set(null);
    }
    trackById(_, item) {
        return item.id;
    }
};
MenuManagementComponent = __decorate([
    Component({
        selector: 'app-menu-management',
        standalone: true,
        imports: [CommonModule, FormsModule],
        templateUrl: './menu-management.component.html',
        styleUrls: ['./menu-management.component.scss']
    })
], MenuManagementComponent);
export { MenuManagementComponent };
//# sourceMappingURL=menu-management.component.js.map