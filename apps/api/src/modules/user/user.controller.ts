import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { User } from './entities/user.entity';
import { ApiResponse } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('waiters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new waiter' })
  @ApiResponse({ status: 201, description: 'Waiter created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async createWaiter(
    @Request() req: { user: { businessId: string } },
    @Body() dto: CreateWaiterDto,
  ) {
    return this.userService.createWaiter(dto, req.user.businessId);
  }

  @Get('waiters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all waiters in the branch' })
  @ApiResponse({ status: 200, description: 'List of waiters.', type: [User] })
  async getWaiters(@Request() req: { user: { branchId: string } }) {
    return this.userService.findAllWaiters(req.user.branchId);
  }

  @Patch('waiters/:id/reset-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reset waiter PIN' })
  async resetWaiterPin(
    @Request() req: { user: { businessId: string } },
    @Param('id') id: string,
  ) {
    return this.userService.resetWaiterPin(id, req.user.businessId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a user/waiter profile' })
  @ApiResponse({ status: 200, description: 'User updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Request() req: { user: { branchId: string } },
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    return this.userService.update(id, req.user.branchId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a waiter' })
  @ApiResponse({ status: 200, description: 'Waiter deleted.' })
  async deleteWaiter(
    @Request() req: { user: { businessId: string } },
    @Param('id') id: string,
  ) {
    return this.userService.removeWaiter(id, req.user.businessId);
  }
}
