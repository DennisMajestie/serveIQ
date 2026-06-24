import { __decorate, __metadata } from "tslib";
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
let JwtStrategy = class JwtStrategy extends PassportStrategy(Strategy) {
    configService;
    constructor(configService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'serveiq-secret-2024',
        });
        this.configService = configService;
    }
    async validate(payload) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            businessId: payload.businessId || payload.business_id,
            branchId: payload.branchId || payload.branch_id,
        };
    }
};
JwtStrategy = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], JwtStrategy);
export { JwtStrategy };
//# sourceMappingURL=jwt.strategy.js.map