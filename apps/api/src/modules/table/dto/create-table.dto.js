import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TableStatus } from '../entities/table.entity';
export class CreateTableDto {
    table_number;
    label;
    capacity;
    status;
    branch_id;
}
__decorate([
    ApiProperty({ example: 'T1' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateTableDto.prototype, "table_number", void 0);
__decorate([
    ApiProperty({ example: 'VIP Table 1', required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateTableDto.prototype, "label", void 0);
__decorate([
    ApiProperty({ example: 4, minimum: 1 }),
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], CreateTableDto.prototype, "capacity", void 0);
__decorate([
    ApiProperty({ enum: TableStatus, default: TableStatus.AVAILABLE }),
    IsEnum(TableStatus),
    IsOptional(),
    __metadata("design:type", String)
], CreateTableDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateTableDto.prototype, "branch_id", void 0);
export class UpdateTableDto extends PartialType(CreateTableDto) {
    branch_id;
}
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateTableDto.prototype, "branch_id", void 0);
//# sourceMappingURL=create-table.dto.js.map