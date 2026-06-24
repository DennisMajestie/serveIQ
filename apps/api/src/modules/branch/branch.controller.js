import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchService } from './branch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { Branch } from './entities/branch.entity';
let BranchController = class BranchController {
    branchService;
    constructor(branchService) {
        this.branchService = branchService;
    }
    async findAll(req) {
        return this.branchService.findAllByBusiness(req.user.businessId);
    }
    async findOne(id, req) {
        return this.branchService.findOne(id, req.user.businessId);
    }
    async getDashboardStats(req) {
        return this.branchService.getDashboardStats(req.user.branchId);
    }
    async create(req, createDto) {
        return this.branchService.create({
            ...createDto,
            business_id: req.user.businessId,
        });
    }
    async update(id, req, updateDto) {
        return this.branchService.update(id, req.user.businessId, updateDto);
    }
    async remove(id, req) {
        return this.branchService.remove(id, req.user.businessId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'List all branches for the authenticated business' }),
    ApiResponse({ status: 200, description: 'Array of branch records.', type: [Branch] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a single branch by ID' }),
    ApiParam({ name: 'id', description: 'Branch UUID', example: 'a1b2c3d4-...' }),
    ApiResponse({ status: 200, description: 'Branch record.', type: Branch }),
    ApiResponse({ status: 404, description: 'Branch not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "findOne", null);
__decorate([
    Get('dashboard/stats'),
    ApiOperation({ summary: 'Get dashboard stats for the authenticated branch' }),
    ApiResponse({ status: 200, description: 'Dashboard statistics.', type: DashboardStatsDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "getDashboardStats", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new branch under the authenticated business' }),
    ApiResponse({ status: 201, description: 'Branch created.' }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "create", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update a branch by ID' }),
    ApiParam({ name: 'id', description: 'Branch UUID', example: 'a1b2c3d4-...' }),
    ApiResponse({ status: 200, description: 'Branch updated.' }),
    ApiResponse({ status: 404, description: 'Branch not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, UpdateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a branch' }),
    ApiParam({ name: 'id', description: 'Branch UUID' }),
    ApiResponse({ status: 200, description: 'Branch deleted.' }),
    ApiResponse({ status: 404, description: 'Branch not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BranchController.prototype, "remove", null);
BranchController = __decorate([
    ApiTags('Branches'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('branches'),
    __metadata("design:paramtypes", [BranchService])
], BranchController);
export { BranchController };
//# sourceMappingURL=branch.controller.js.map