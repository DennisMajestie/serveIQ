import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TabService } from './tab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OpenTabDto } from './dto/open-tab.dto';
import { TransferTabDto } from './dto/transfer-tab.dto';
import { Tab } from './entities/tab.entity';

@ApiTags('Tabs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tabs')
export class TabController {
  constructor(private readonly tabService: TabService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tabs for the branch (optionally filtered by status)' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'billed', 'paid', 'voided'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of tabs with details.', type: [Tab] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.tabService.findAllByBranch(req.user.branchId, status, page, perPage);
  }

  @Post('open')
  @ApiOperation({ summary: 'Open a new tab at a table' })
  @ApiResponse({ status: 201, description: 'Tab opened successfully.', type: Tab })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async openTab(@Request() req: any, @Body() createDto: OpenTabDto) {
    return this.tabService.openTab({
      ...createDto,
      branch_id: req.user.branchId,
      waiter_id: req.user.userId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tab by ID (includes its orders)' })
  @ApiParam({ name: 'id', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiResponse({ status: 200, description: 'Tab record with order items.', type: Tab })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.tabService.findOne(id, req.user.branchId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close an open tab (triggers billing)' })
  @ApiParam({ name: 'id', description: 'Tab UUID', example: 'tab-uuid-here' })
  @ApiResponse({ status: 200, description: 'Tab closed and bill generated.' })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async closeTab(@Param('id') id: string, @Request() req: any) {
    return this.tabService.closeTab(id, req.user.branchId);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void an open tab and release the table' })
  @ApiParam({ name: 'id', description: 'Tab UUID' })
  @ApiResponse({ status: 200, description: 'Tab voided and table released.' })
  @ApiResponse({ status: 404, description: 'Tab not found or not open.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async voidTab(@Param('id') id: string, @Request() req: any) {
    return this.tabService.voidTab(id, req.user.branchId);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer an open tab to another table' })
  @ApiParam({ name: 'id', description: 'Current tab UUID' })
  @ApiResponse({ status: 200, description: 'Tab transferred to new table.' })
  @ApiResponse({ status: 404, description: 'Tab not found or target table unavailable.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async transferTab(@Param('id') id: string, @Request() req: any, @Body() dto: TransferTabDto) {
    return this.tabService.transferTab(id, dto.target_table_id, req.user.branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tab' })
  @ApiParam({ name: 'id', description: 'Tab UUID' })
  @ApiResponse({ status: 200, description: 'Tab updated.' })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(@Param('id') id: string, @Request() req: any, @Body() updateDto: any) {
    return this.tabService.update(id, req.user.branchId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tab' })
  @ApiParam({ name: 'id', description: 'Tab UUID' })
  @ApiResponse({ status: 200, description: 'Tab deleted.' })
  @ApiResponse({ status: 404, description: 'Tab not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.tabService.remove(id, req.user.branchId);
  }
}


