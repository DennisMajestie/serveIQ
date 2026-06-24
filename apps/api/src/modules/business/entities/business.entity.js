import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, } from 'typeorm';
import { Branch } from '../../branch/entities/branch.entity';
let Business = class Business {
    id;
    name;
    slug;
    type;
    owner_id;
    email;
    phone;
    address;
    currency;
    subscription_plan;
    logo_url;
    cac_document_url;
    is_active;
    created_at;
    updated_at;
    deleted_at;
    branches;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Business.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Business.prototype, "name", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Business.prototype, "slug", void 0);
__decorate([
    Column({ type: 'enum', enum: ['bar', 'lounge', 'restaurant', 'club', 'cafe'] }),
    __metadata("design:type", String)
], Business.prototype, "type", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Business.prototype, "owner_id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Business.prototype, "email", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "phone", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "address", void 0);
__decorate([
    Column({ default: 'NGN' }),
    __metadata("design:type", String)
], Business.prototype, "currency", void 0);
__decorate([
    Column({ default: 'free_trial' }),
    __metadata("design:type", String)
], Business.prototype, "subscription_plan", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "logo_url", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "cac_document_url", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Business.prototype, "is_active", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Business.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Business.prototype, "updated_at", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Business.prototype, "deleted_at", void 0);
__decorate([
    OneToMany(() => Branch, (branch) => branch.business),
    __metadata("design:type", Array)
], Business.prototype, "branches", void 0);
Business = __decorate([
    Entity('businesses')
], Business);
export { Business };
//# sourceMappingURL=business.entity.js.map