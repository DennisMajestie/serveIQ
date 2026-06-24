import { __decorate, __metadata } from "tslib";
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class RegisterDto {
    fullName;
    email;
    password;
    businessName;
    businessType;
    logoUrl;
    cacDocumentUrl;
}
__decorate([
    ApiProperty({ example: 'John Doe', description: 'Full name of the business owner' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    ApiProperty({ example: 'owner@restaurant.com', description: 'Owner email address' }),
    IsEmail(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'SuperSecret8!', description: 'Password (min 8 characters)' }),
    IsNotEmpty(),
    MinLength(8),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    ApiProperty({ example: 'The Golden Fork', description: 'Name of the business' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "businessName", void 0);
__decorate([
    ApiProperty({
        example: 'restaurant',
        description: 'Type of hospitality business',
        enum: ['bar', 'lounge', 'restaurant', 'club', 'cafe'],
    }),
    IsNotEmpty(),
    IsEnum(['bar', 'lounge', 'restaurant', 'club', 'cafe']),
    __metadata("design:type", String)
], RegisterDto.prototype, "businessType", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://...', description: 'Business logo URL (from /api/upload)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "logoUrl", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://...', description: 'CAC document URL (from /api/upload) — optional' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "cacDocumentUrl", void 0);
//# sourceMappingURL=register.dto.js.map