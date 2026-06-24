import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('tab/:tabId')
  @ApiOperation({ summary: 'Add order items to an open tab' })
  @ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiBody({ type: [CreateOrderItemDto] })
  @ApiResponse({ status: 201, description: 'Order items added to tab.', type: [Order] })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async addItems(@Param('tabId') tabId: string, @Request() req: any, @Body() items: CreateOrderItemDto[]) {
    return this.orderService.addOrderItems(tabId, items, req.user.userId);
  }

  @Get('tab/:tabId')
  @ApiOperation({ summary: 'Get all orders for a specific tab' })
  @ApiParam({ name: 'tabId', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiResponse({ status: 200, description: 'List of order items for the tab.', type: [Order] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findByTab(@Param('tabId') tabId: string) {
    return this.orderService.findByTab(tabId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order item by ID' })
  @ApiParam({ name: 'id', description: 'Order item UUID' })
  @ApiResponse({ status: 200, description: 'Order item details.' })
  @ApiResponse({ status: 404, description: 'Order item not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order item quantity or notes' })
  @ApiParam({ name: 'id', description: 'Order item UUID' })
  @ApiResponse({ status: 200, description: 'Order item updated.' })
  @ApiResponse({ status: 404, description: 'Order item not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrderDto) {
    return this.orderService.updateOrder(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an order item from a tab' })
  @ApiParam({ name: 'id', description: 'Order item UUID' })
  @ApiResponse({ status: 200, description: 'Order item removed.' })
  @ApiResponse({ status: 404, description: 'Order item not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@Param('id') id: string) {
    return this.orderService.removeOrder(id);
  }
}


