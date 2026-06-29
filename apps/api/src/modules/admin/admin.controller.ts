import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/shared';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Business } from '../business/entities/business.entity';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('businesses')
  @ApiOperation({ summary: 'List all businesses (super admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of businesses.' })
  async findAllBusinesses(
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.adminService.findAllBusinesses(page, perPage);
  }

  @Get('businesses/:id')
  @ApiOperation({ summary: 'Get business details (super admin)' })
  @ApiResponse({ status: 200, description: 'Business details.' })
  async findBusinessById(@Param('id') id: string) {
    return this.adminService.findBusinessById(id);
  }

  @Patch('businesses/:id')
  @ApiOperation({ summary: 'Update a business (super admin)' })
  @ApiResponse({ status: 200, description: 'Business updated.' })
  async updateBusiness(@Param('id') id: string, @Body() updateDto: any) {
    return this.adminService.updateBusiness(id, updateDto);
  }

  @Post('businesses/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle business active status (super admin)' })
  @ApiResponse({ status: 200, description: 'Business status toggled.' })
  async toggleBusinessActive(@Param('id') id: string) {
    return this.adminService.toggleBusinessActive(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated stats across all businesses (super admin)' })
  @ApiResponse({ status: 200, description: 'Aggregated statistics.' })
  async getAggregatedStats() {
    return this.adminService.getAggregatedStats();
  }
}
