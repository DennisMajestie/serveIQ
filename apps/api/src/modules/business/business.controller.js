import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
let BusinessController = class BusinessController {
    businessService;
    constructor(businessService) {
        this.businessService = businessService;
    }
    async getMe(req) {
        return this.businessService.findOne(req.user.businessId);
    }
    async updateMe(req, updateDto) {
        return this.businessService.update(req.user.businessId, updateDto);
    }
};
__decorate([
    Get('me'),
    ApiOperation({ summary: 'Get the authenticated business profile' }),
    ApiResponse({ status: 200, description: 'Business profile returned.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "getMe", null);
__decorate([
    Patch('me'),
    ApiOperation({ summary: 'Update the authenticated business profile' }),
    ApiResponse({ status: 200, description: 'Business profile updated.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BusinessController.prototype, "updateMe", null);
BusinessController = __decorate([
    ApiTags('Businesses'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('businesses'),
    __metadata("design:paramtypes", [BusinessService])
], BusinessController);
export { BusinessController };
//# sourceMappingURL=business.controller.js.map