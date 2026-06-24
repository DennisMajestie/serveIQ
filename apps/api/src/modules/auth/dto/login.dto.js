import { __decorate, __metadata } from "tslib";
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
    email;
    password;
}
__decorate([
    ApiProperty({ example: 'owner@restaurant.com', description: 'Registered email address' }),
    IsEmail(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'SuperSecret8!', description: 'Account password' }),
    IsNotEmpty(),
    MinLength(8),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
//# sourceMappingURL=login.dto.js.map