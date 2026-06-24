import { __decorate, __metadata } from "tslib";
import { IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateOrderDto {
    quantity;
    notes;
}
__decorate([
    ApiProperty({ example: 5, minimum: 1 }),
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], UpdateOrderDto.prototype, "quantity", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "notes", void 0);
//# sourceMappingURL=update-order.dto.js.map