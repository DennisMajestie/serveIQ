import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TabService } from './tab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OpenTabDto } from './dto/open-tab.dto';
import { Tab } from './entities/tab.entity';
let TabController = class TabController {
    tabService;
    constructor(tabService) {
        this.tabService = tabService;
    }
    async findAll(req, status) {
        return this.tabService.findAllByBranch(req.user.branchId, status);
    }
    async openTab(req, createDto) {
        return this.tabService.openTab({
            ...createDto,
            branch_id: req.user.branchId,
            waiter_id: req.user.userId,
        });
    }
    async findOne(id, req) {
        return this.tabService.findOne(id, req.user.branchId);
    }
    async closeTab(id, req) {
        return this.tabService.closeTab(id, req.user.branchId);
    }
    async update(id, req, updateDto) {
        return this.tabService.update(id, req.user.branchId, updateDto);
    }
    async remove(id, req) {
        return this.tabService.remove(id, req.user.branchId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all tabs for the branch (optionally filtered by status)' }),
    ApiQuery({ name: 'status', required: false, enum: ['open', 'billed', 'paid', 'voided'] }),
    ApiResponse({ status: 200, description: 'List of tabs with details.', type: [Tab] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "findAll", null);
__decorate([
    Post('open'),
    ApiOperation({ summary: 'Open a new tab at a table' }),
    ApiResponse({ status: 201, description: 'Tab opened successfully.', type: Tab }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, OpenTabDto]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "openTab", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a tab by ID (includes its orders)' }),
    ApiParam({ name: 'id', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiResponse({ status: 200, description: 'Tab record with order items.', type: Tab }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "findOne", null);
__decorate([
    Post(':id/close'),
    ApiOperation({ summary: 'Close an open tab (triggers billing)' }),
    ApiParam({ name: 'id', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiResponse({ status: 200, description: 'Tab closed and bill generated.' }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "closeTab", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update a tab' }),
    ApiParam({ name: 'id', description: 'Tab UUID' }),
    ApiResponse({ status: 200, description: 'Tab updated.' }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a tab' }),
    ApiParam({ name: 'id', description: 'Tab UUID' }),
    ApiResponse({ status: 200, description: 'Tab deleted.' }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TabController.prototype, "remove", null);
TabController = __decorate([
    ApiTags('Tabs'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('tabs'),
    __metadata("design:paramtypes", [TabService])
], TabController);
export { TabController };
//# sourceMappingURL=tab.controller.js.map