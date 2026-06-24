import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, } from 'typeorm';
let MenuItem = class MenuItem {
    id;
    branch_id;
    name;
    category;
    price_kobo;
    unit;
    sku;
    barcode;
    image_url;
    is_available;
    created_by;
    created_at;
    updated_at;
    deleted_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], MenuItem.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], MenuItem.prototype, "branch_id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], MenuItem.prototype, "category", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], MenuItem.prototype, "price_kobo", void 0);
__decorate([
    Column({ default: 'unit' }),
    __metadata("design:type", String)
], MenuItem.prototype, "unit", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "sku", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "barcode", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "image_url", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "is_available", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], MenuItem.prototype, "created_by", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], MenuItem.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], MenuItem.prototype, "updated_at", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], MenuItem.prototype, "deleted_at", void 0);
MenuItem = __decorate([
    Entity('menu_items')
], MenuItem);
export { MenuItem };
//# sourceMappingURL=menu-item.entity.js.map