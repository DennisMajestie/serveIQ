import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
let Order = class Order {
    id;
    tab_id;
    menu_item_id;
    quantity;
    unit_price_kobo;
    subtotal_kobo;
    round_number;
    voice_transcription;
    notes;
    created_by;
    created_at;
    updated_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Order.prototype, "tab_id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Order.prototype, "menu_item_id", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], Order.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], Order.prototype, "unit_price_kobo", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal_kobo", void 0);
__decorate([
    Column({ default: 1 }),
    __metadata("design:type", Number)
], Order.prototype, "round_number", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "voice_transcription", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "notes", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Order.prototype, "created_by", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Order.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Order.prototype, "updated_at", void 0);
Order = __decorate([
    Entity('orders')
], Order);
export { Order };
//# sourceMappingURL=order.entity.js.map