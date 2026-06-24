import { __decorate, __metadata } from "tslib";
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateProfileDto {
    full_name;
    phone;
    password;
}
__decorate([
    ApiProperty({ required: false }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "full_name", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
__decorate([
    ApiProperty({ required: false, minLength: 8 }),
    IsOptional(),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "password", void 0);
//# sourceMappingURL=update-profile.dto.js.map