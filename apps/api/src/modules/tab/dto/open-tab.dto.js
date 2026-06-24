import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class OpenTabDto {
    table_id;
    customer_name;
    party_size;
    notes;
}
__decorate([
    ApiProperty({ example: 'table-uuid-123', description: 'UUID of the table where the tab is opened' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], OpenTabDto.prototype, "table_id", void 0);
__decorate([
    ApiProperty({ example: 'John Doe', description: 'Name of the customer (optional)', required: false }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OpenTabDto.prototype, "customer_name", void 0);
__decorate([
    ApiProperty({ example: 4, description: 'Number of people in the party', default: 1 }),
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], OpenTabDto.prototype, "party_size", void 0);
__decorate([
    ApiProperty({ example: 'Sitting near the window', description: 'Special notes for the tab', required: false }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OpenTabDto.prototype, "notes", void 0);
//# sourceMappingURL=open-tab.dto.js.map