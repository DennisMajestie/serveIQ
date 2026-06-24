import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index, } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { UserRole } from '../../../common/shared';
let User = class User {
    id;
    business_id;
    business;
    branch_id;
    branch;
    full_name;
    email;
    phone;
    avatar_url;
    password_hash;
    pin_hash;
    role;
    is_active;
    email_verified_at;
    last_login_at;
    invited_by;
    created_at;
    updated_at;
    deleted_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], User.prototype, "business_id", void 0);
__decorate([
    ManyToOne(() => Business),
    JoinColumn({ name: 'business_id' }),
    __metadata("design:type", Business)
], User.prototype, "business", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], User.prototype, "branch_id", void 0);
__decorate([
    ManyToOne(() => Branch),
    JoinColumn({ name: 'branch_id' }),
    __metadata("design:type", Branch)
], User.prototype, "branch", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], User.prototype, "full_name", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar_url", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], User.prototype, "password_hash", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "pin_hash", void 0);
__decorate([
    Column({ type: 'enum', enum: UserRole, default: UserRole.WAITER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "is_active", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "email_verified_at", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "last_login_at", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "invited_by", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "deleted_at", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
//# sourceMappingURL=user.entity.js.map