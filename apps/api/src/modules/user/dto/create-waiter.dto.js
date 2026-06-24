import { __decorate, __metadata } from "tslib";
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateWaiterDto {
    fullName;
    email;
    phone;
    branchId;
    avatar_url;
}
__decorate([
    ApiProperty({ example: 'Jane Waiter', description: 'Full name of the waiter' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateWaiterDto.prototype, "fullName", void 0);
__decorate([
    ApiPropertyOptional({ example: 'jane@bistro.com', description: 'Waiter email (optional)' }),
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], CreateWaiterDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional({ example: '+2348012345678', description: 'Waiter phone number (optional)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateWaiterDto.prototype, "phone", void 0);
__decorate([
    ApiProperty({ example: 'uuid-of-branch', description: 'Branch the waiter belongs to' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateWaiterDto.prototype, "branchId", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL of the waiter avatar image' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateWaiterDto.prototype, "avatar_url", void 0);
//# sourceMappingURL=create-waiter.dto.js.map