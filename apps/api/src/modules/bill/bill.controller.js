import { __decorate, __metadata, __param } from "tslib";
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BillService } from './bill.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { GenerateBillDto } from './dto/generate-bill.dto';
let BillController = class BillController {
    billService;
    constructor(billService) {
        this.billService = billService;
    }
    async generateBill(tabId, req, generateBillDto) {
        return this.billService.generateBill(tabId, req.user.userId, generateBillDto);
    }
    async payBill(tabId, paymentDto) {
        return this.billService.processPayment(tabId, paymentDto);
    }
    async getReceipt(tabId) {
        return this.billService.getReceipt(tabId);
    }
};
__decorate([
    Post('tab/:tabId/generate'),
    ApiOperation({ summary: 'Generate a bill for an open tab' }),
    ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiBody({ type: GenerateBillDto, required: false }),
    ApiResponse({ status: 201, description: 'Bill generated successfully.' }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('tabId')),
    __param(1, Request()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, GenerateBillDto]),
    __metadata("design:returntype", Promise)
], BillController.prototype, "generateBill", null);
__decorate([
    Post('tab/:tabId/pay'),
    ApiOperation({ summary: 'Process payment for a tab bill' }),
    ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiBody({ type: ProcessPaymentDto }),
    ApiResponse({ status: 200, description: 'Payment processed, tab closed.' }),
    ApiResponse({ status: 404, description: 'Tab not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('tabId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ProcessPaymentDto]),
    __metadata("design:returntype", Promise)
], BillController.prototype, "payBill", null);
__decorate([
    Get('tab/:tabId/receipt'),
    ApiOperation({ summary: 'Get receipt for a paid tab' }),
    ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' }),
    ApiResponse({ status: 200, description: 'Receipt details.' }),
    ApiResponse({ status: 404, description: 'Tab or bill not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    __param(0, Param('tabId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillController.prototype, "getReceipt", null);
BillController = __decorate([
    ApiTags('Bills'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('bills'),
    __metadata("design:paramtypes", [BillService])
], BillController);
export { BillController };
//# sourceMappingURL=bill.controller.js.map