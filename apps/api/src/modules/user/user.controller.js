import { __decorate, __metadata, __param } from "tslib";
import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, Delete, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { User } from './entities/user.entity';
import { ApiResponse } from '@nestjs/swagger';
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async createWaiter(req, dto) {
        return this.userService.createWaiter(dto, req.user.businessId);
    }
    async getWaiters(req) {
        return this.userService.findAllWaiters(req.user.branchId);
    }
    async resetWaiterPin(req, id) {
        return this.userService.resetWaiterPin(id, req.user.businessId);
    }
    async update(req, id, updateDto) {
        return this.userService.update(id, req.user.branchId, updateDto);
    }
    async deleteWaiter(req, id) {
        return this.userService.removeWaiter(id, req.user.businessId);
    }
};
__decorate([
    Post('waiters'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Create a new waiter' }),
    ApiResponse({ status: 201, description: 'Waiter created.' }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateWaiterDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createWaiter", null);
__decorate([
    Get('waiters'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'List all waiters in the branch' }),
    ApiResponse({ status: 200, description: 'List of waiters.', type: [User] }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getWaiters", null);
__decorate([
    Patch('waiters/:id/reset-pin'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Reset waiter PIN' }),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetWaiterPin", null);
__decorate([
    Patch(':id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Update a user/waiter profile' }),
    ApiResponse({ status: 200, description: 'User updated.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    Delete(':id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Delete a waiter' }),
    ApiResponse({ status: 200, description: 'Waiter deleted.' }),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteWaiter", null);
UserController = __decorate([
    ApiTags('User'),
    Controller('user'),
    __metadata("design:paramtypes", [UserService])
], UserController);
export { UserController };
//# sourceMappingURL=user.controller.js.map