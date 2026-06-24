import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
let Bill = class Bill {
    id;
    tab_id;
    subtotal_kobo;
    service_charge_kobo;
    discount_kobo;
    total_kobo;
    payment_method;
    payment_reference;
    paid_at;
    issued_by;
    receipt_url;
    created_at;
    updated_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Bill.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Bill.prototype, "tab_id", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], Bill.prototype, "subtotal_kobo", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Bill.prototype, "service_charge_kobo", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Bill.prototype, "discount_kobo", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], Bill.prototype, "total_kobo", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: ['cash', 'transfer', 'pos', 'card'],
        nullable: true,
    }),
    __metadata("design:type", String)
], Bill.prototype, "payment_method", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Bill.prototype, "payment_reference", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Bill.prototype, "paid_at", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Bill.prototype, "issued_by", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Bill.prototype, "receipt_url", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Bill.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Bill.prototype, "updated_at", void 0);
Bill = __decorate([
    Entity('bills')
], Bill);
export { Bill };
//# sourceMappingURL=bill.entity.js.map