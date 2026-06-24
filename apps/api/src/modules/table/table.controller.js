import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { TableService } from './table.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { Table } from './entities/table.entity';
let TableController = class TableController {
    tableService;
    constructor(tableService) {
        this.tableService = tableService;
    }
    async findAll(req) {
        return this.tableService.findAllByBranch(req.user.branchId);
    }
    async findOne(id, req) {
        return this.tableService.findOne(id, req.user.branchId);
    }
    async create(req, createDto) {
        const data = { ...createDto };
        // Defensive mapping for Waiter app or other clients that might send different field names
        if (!data.table_number) {
            data.table_number = data.tableName || data.name || data.tableNumber || `T-${Math.floor(Math.random() * 1000)}`;
        }
        return this.tableService.create({
            ...data,
            branch_id: req.user.branchId,
        });
    }
    async update(id, req, updateDto) {
        return this.tableService.update(id, req.user.branchId, updateDto);
    }
    async updateStatus(id, req, statusDto) {
        return this.tableService.updateStatus(id, req.user.branchId, statusDto.status);
    }
    async remove(id, req) {
        return this.tableService.remove(id, req.user.branchId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all tables for the branch' }),
    ApiResponse({ status: 200, description: 'List of tables with statuses.', type: [Table] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a table by ID' }),
    ApiParam({ name: 'id', description: 'Table UUID' }),
    ApiResponse({ status: 200, description: 'Table details.', type: Table }),
    ApiResponse({ status: 404, description: 'Table not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "findOne", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new table' }),
    ApiResponse({ status: 201, description: 'Table created.', type: Table }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "create", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update a table' }),
    ApiParam({ name: 'id', description: 'Table UUID' }),
    ApiResponse({ status: 200, description: 'Table updated.' }),
    ApiResponse({ status: 404, description: 'Table not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "update", null);
__decorate([
    Patch(':id/status'),
    ApiOperation({ summary: 'Update table status (available/occupied/reserved)' }),
    ApiParam({ name: 'id', description: 'Table UUID' }),
    ApiResponse({ status: 200, description: 'Table status updated.' }),
    ApiResponse({ status: 404, description: 'Table not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, UpdateTableStatusDto]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "updateStatus", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a table' }),
    ApiParam({ name: 'id', description: 'Table UUID' }),
    ApiResponse({ status: 200, description: 'Table deleted.' }),
    ApiResponse({ status: 404, description: 'Table not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "remove", null);
TableController = __decorate([
    ApiTags('Tables'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('tables'),
    __metadata("design:paramtypes", [TableService])
], TableController);
export { TableController };
//# sourceMappingURL=table.controller.js.map