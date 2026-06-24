import { __decorate, __metadata } from "tslib";
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateTabDto {
    customer_name;
    party_size;
    notes;
}
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateTabDto.prototype, "customer_name", void 0);
__decorate([
    ApiProperty({ example: 4, required: false, minimum: 1 }),
    IsNumber(),
    Min(1),
    IsOptional(),
    __metadata("design:type", Number)
], UpdateTabDto.prototype, "party_size", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateTabDto.prototype, "notes", void 0);
//# sourceMappingURL=update-tab.dto.js.map