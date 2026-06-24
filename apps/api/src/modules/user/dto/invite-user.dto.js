import { __decorate, __metadata } from "tslib";
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/shared';
export class InviteUserDto {
    email;
    full_name;
    role;
    phone;
    avatar_url;
}
__decorate([
    ApiProperty({ example: 'waiter@example.com' }),
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'John Waiter' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "full_name", void 0);
__decorate([
    ApiProperty({ enum: UserRole, example: UserRole.WAITER }),
    IsEnum(UserRole),
    IsNotEmpty(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "role", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "phone", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "avatar_url", void 0);
//# sourceMappingURL=invite-user.dto.js.map