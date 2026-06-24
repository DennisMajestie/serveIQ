import { __decorate, __metadata } from "tslib";
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class GenerateBillDto {
    service_charge_percent;
    discount_kobo;
}
__decorate([
    ApiProperty({ example: 10, required: false, minimum: 0 }),
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], GenerateBillDto.prototype, "service_charge_percent", void 0);
__decorate([
    ApiProperty({ example: 0, required: false, minimum: 0, description: 'Discount in kobo' }),
    IsNumber(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], GenerateBillDto.prototype, "discount_kobo", void 0);
//# sourceMappingURL=generate-bill.dto.js.map