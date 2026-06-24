import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index, } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
let Branch = class Branch {
    id;
    business_id;
    business;
    name;
    address;
    phone;
    settings;
    is_active;
    created_at;
    updated_at;
    deleted_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Branch.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Branch.prototype, "business_id", void 0);
__decorate([
    ManyToOne(() => Business, (business) => business.branches),
    JoinColumn({ name: 'business_id' }),
    __metadata("design:type", Business)
], Branch.prototype, "business", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Branch.prototype, "name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Branch.prototype, "address", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Branch.prototype, "phone", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Branch.prototype, "settings", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Branch.prototype, "is_active", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Branch.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Branch.prototype, "updated_at", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Branch.prototype, "deleted_at", void 0);
Branch = __decorate([
    Entity('branches')
], Branch);
export { Branch };
//# sourceMappingURL=branch.entity.js.map