import { __decorate, __metadata } from "tslib";
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class VoidTabDto {
    reason;
}
__decorate([
    ApiProperty({ example: 'Customer changed their mind' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], VoidTabDto.prototype, "reason", void 0);
//# sourceMappingURL=void-tab.dto.js.map