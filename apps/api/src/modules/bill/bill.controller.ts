import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BillService } from './bill.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { GenerateBillDto } from './dto/generate-bill.dto';

@ApiTags('Bills')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('tab/:tabId/generate')
  @ApiOperation({ summary: 'Generate a bill for an open tab' })
  @ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiBody({ type: GenerateBillDto, required: false })
  @ApiResponse({ status: 201, description: 'Bill generated successfully.' })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async generateBill(
    @Param('tabId') tabId: string,
    @Request() req: any,
    @Body() generateBillDto?: GenerateBillDto,
  ) {
    return this.billService.generateBill(tabId, req.user.userId, generateBillDto);
  }

  @Post('tab/:tabId/pay')
  @ApiOperation({ summary: 'Process payment for a tab bill' })
  @ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment processed, tab closed.' })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async payBill(@Param('tabId') tabId: string, @Body() paymentDto: ProcessPaymentDto) {
    return this.billService.processPayment(tabId, paymentDto);
  }

  @Get('tab/:tabId/receipt')
  @ApiOperation({ summary: 'Get receipt for a paid tab' })
  @ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiResponse({ status: 200, description: 'Receipt details.' })
  @ApiResponse({ status: 404, description: 'Tab or bill not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getReceipt(@Param('tabId') tabId: string) {
    return this.billService.getReceipt(tabId);
  }
}


