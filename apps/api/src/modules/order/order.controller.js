import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
let OrderController = class OrderController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    async addItems(tabId, req, items) {
        return this.orderService.addOrderItems(tabId, items, req.user.userId);
    }
    async findByTab(tabId) {
        return this.orderService.findByTab(tabId);
    }
    async findOne(id) {
        return this.orderService.findOne(id);
    }
    async update(id, updateDto) {
        return this.orderService.updateOrder(id, updateDto);
    }
    async remove(id) {
        return this.orderService.removeOrder(id);
    }
};
__decorate([
    Post('tab/:tabId'),
    ApiOperation({ summary: 'Add order items to an open tab' }),
    ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiBody({ type: [CreateOrderItemDto] }),
    ApiResponse({ status: 201, description: 'Order items added to tab.', type: [Order] }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('tabId')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "addItems", null);
__decorate([
    Get('tab/:tabId'),
    ApiOperation({ summary: 'Get all orders for a specific tab' }),
    ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiResponse({ status: 200, description: 'List of order items for the tab.', type: [Order] }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('tabId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findByTab", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a specific order item by ID' }),
    ApiParam({ name: 'id', description: 'Order item UUID' }),
    ApiResponse({ status: 200, description: 'Order item details.' }),
    ApiResponse({ status: 404, description: 'Order item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update order item quantity or notes' }),
    ApiParam({ name: 'id', description: 'Order item UUID' }),
    ApiResponse({ status: 200, description: 'Order item updated.' }),
    ApiResponse({ status: 404, description: 'Order item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrderDto]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Remove an order item from a tab' }),
    ApiParam({ name: 'id', description: 'Order item UUID' }),
    ApiResponse({ status: 200, description: 'Order item removed.' }),
    ApiResponse({ status: 404, description: 'Order item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "remove", null);
OrderController = __decorate([
    ApiTags('Orders'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('orders'),
    __metadata("design:paramtypes", [OrderService])
], OrderController);
export { OrderController };
//# sourceMappingURL=order.controller.js.map