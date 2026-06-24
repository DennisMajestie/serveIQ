import { __decorate, __metadata } from "tslib";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, } from 'typeorm';
export var TableStatus;
(function (TableStatus) {
    TableStatus["AVAILABLE"] = "available";
    TableStatus["OCCUPIED"] = "occupied";
    TableStatus["RESERVED"] = "reserved";
})(TableStatus || (TableStatus = {}));
let Table = class Table {
    id;
    branch_id;
    table_number;
    label;
    capacity;
    status;
    created_at;
    updated_at;
    deleted_at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Table.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Table.prototype, "branch_id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Table.prototype, "table_number", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Table.prototype, "label", void 0);
__decorate([
    Column({ default: 1 }),
    __metadata("design:type", Number)
], Table.prototype, "capacity", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: TableStatus,
        default: TableStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Table.prototype, "status", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Table.prototype, "created_at", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Table.prototype, "updated_at", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Table.prototype, "deleted_at", void 0);
Table = __decorate([
    Entity('tables'),
    Index(['branch_id', 'table_number'], { unique: true })
], Table);
export { Table };
//# sourceMappingURL=table.entity.js.map