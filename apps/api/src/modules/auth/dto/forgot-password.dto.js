import { __decorate, __metadata } from "tslib";
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ForgotPasswordDto {
    email;
}
__decorate([
    ApiProperty({ example: 'user@example.com' }),
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
//# sourceMappingURL=forgot-password.dto.js.map