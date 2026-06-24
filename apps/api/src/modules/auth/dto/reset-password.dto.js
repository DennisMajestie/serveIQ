import { __decorate, __metadata } from "tslib";
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ResetPasswordDto {
    token;
    password;
}
__decorate([
    ApiProperty(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    ApiProperty({ minLength: 8 }),
    IsString(),
    IsNotEmpty(),
    MinLength(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
//# sourceMappingURL=reset-password.dto.js.map