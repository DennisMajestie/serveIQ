import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
let Tab = class Tab {
    id;
    branch_id;
    table_id;
    waiter_id;
    cashier_id;
    tab_number;
    customer_name;
    party_size;
    status;
    notes;
    opened_at;
    billed_at;
    closed_at;
    updated_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Tab.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Tab.prototype, "branch_id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Tab.prototype, "table_id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Tab.prototype, "waiter_id", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Tab.prototype, "cashier_id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Tab.prototype, "tab_number", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Tab.prototype, "customer_name", void 0);
__decorate([
    Column({ default: 1 }),
    __metadata("design:type", Number)
], Tab.prototype, "party_size", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: ['open', 'billed', 'paid', 'voided'],
        default: 'open',
    }),
    __metadata("design:type", String)
], Tab.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Tab.prototype, "notes", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Tab.prototype, "opened_at", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Tab.prototype, "billed_at", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Tab.prototype, "closed_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Tab.prototype, "updated_at", void 0);
Tab = __decorate([
    Entity('tabs')
], Tab);
export { Tab };
//# sourceMappingURL=tab.entity.js.map