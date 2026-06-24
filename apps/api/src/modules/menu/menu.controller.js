import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MenuItem } from './entities/menu-item.entity';
let MenuController = class MenuController {
    menuService;
    constructor(menuService) {
        this.menuService = menuService;
    }
    async findAll(req) {
        return this.menuService.findAllByBranch(req.user.branchId);
    }
    async findOne(id, req) {
        return this.menuService.findOne(id, req.user.branchId);
    }
    async create(req, createDto) {
        const data = { ...createDto };
        if (data.price && !data.price_kobo) {
            data.price_kobo = Math.round(data.price * 100);
        }
        return this.menuService.create({
            ...data,
            branch_id: req.user.branchId,
            created_by: req.user.userId,
        });
    }
    async update(id, req, updateDto) {
        const data = { ...updateDto };
        if (data.price && !data.price_kobo) {
            data.price_kobo = Math.round(data.price * 100);
        }
        return this.menuService.update(id, req.user.branchId, data);
    }
    async remove(id, req) {
        return this.menuService.remove(id, req.user.branchId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all available menu items for the branch' }),
    ApiResponse({ status: 200, description: 'List of menu items.', type: [MenuItem] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a menu item by ID' }),
    ApiParam({ name: 'id', description: 'Menu item UUID' }),
    ApiResponse({ status: 200, description: 'Menu item details.', type: MenuItem }),
    ApiResponse({ status: 404, description: 'Menu item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "findOne", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new menu item' }),
    ApiResponse({ status: 201, description: 'Menu item created.', type: MenuItem }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "create", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update a menu item' }),
    ApiParam({ name: 'id', description: 'Menu item UUID' }),
    ApiResponse({ status: 200, description: 'Menu item updated.' }),
    ApiResponse({ status: 404, description: 'Menu item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a menu item' }),
    ApiParam({ name: 'id', description: 'Menu item UUID' }),
    ApiResponse({ status: 200, description: 'Menu item deleted.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "remove", null);
MenuController = __decorate([
    ApiTags('Menu'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('menu'),
    __metadata("design:paramtypes", [MenuService])
], MenuController);
export { MenuController };
//# sourceMappingURL=menu.controller.js.map