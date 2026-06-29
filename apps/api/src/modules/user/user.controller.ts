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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { ApiResponse } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved.' })
  async getMe(@Request() req: any) {
    return this.userService.getMe(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  async updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateMe(req.user.userId, dto);
  }

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
  @ApiOperation({ summary: 'List all waiters in the business' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of waiters.', type: [User] })
  async getWaiters(
    @Request() req: { user: { businessId: string; branchId: string } },
    @Query('branch_id') branchId?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.userService.findAllWaiters(
      req.user.businessId,
      branchId || req.user.branchId,
      page,
      perPage,
    );
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

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated.' })
  async deactivate(
    @Request() req: { user: { businessId: string } },
    @Param('id') id: string,
  ) {
    return this.userService.deactivate(id, req.user.businessId);
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
