import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class WaiterLoginDto {
    pin;
    branchId;
    businessId;
}
__decorate([
    ApiProperty({ example: '1234', description: '4-digit PIN assigned to the waiter by admin' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], WaiterLoginDto.prototype, "pin", void 0);
__decorate([
    ApiProperty({ example: 'uuid-of-branch', description: 'Branch ID the waiter belongs to', required: false }),
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], WaiterLoginDto.prototype, "branchId", void 0);
__decorate([
    ApiProperty({ example: 'uuid-of-business', description: 'Business ID the waiter belongs to', required: false }),
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], WaiterLoginDto.prototype, "businessId", void 0);
//# sourceMappingURL=waiter-login.dto.js.map