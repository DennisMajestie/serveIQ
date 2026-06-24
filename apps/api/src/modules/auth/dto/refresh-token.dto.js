import { __decorate, __metadata } from "tslib";
// Refresh token is handled via HTTP-only cookie, no DTO body needed
// But we'll define it for Swagger
import { ApiProperty } from '@nestjs/swagger';
export class RefreshTokenDto {
    refresh_token;
}
__decorate([
    ApiProperty({ description: 'Refresh token (sent via HTTP-only cookie)' }),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refresh_token", void 0);
//# sourceMappingURL=refresh-token.dto.js.map