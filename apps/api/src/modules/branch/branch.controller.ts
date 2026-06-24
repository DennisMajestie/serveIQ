import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchService } from './branch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { Branch } from './entities/branch.entity';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @ApiOperation({ summary: 'List all branches for the authenticated business' })
  @ApiResponse({ status: 200, description: 'Array of branch records.', type: [Branch] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Request() req: any) {
    return this.branchService.findAllByBusiness(req.user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single branch by ID' })
  @ApiParam({ name: 'id', description: 'Branch UUID', example: 'a1b2c3d4-...' })
  @ApiResponse({ status: 200, description: 'Branch record.', type: Branch })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.branchService.findOne(id, req.user.businessId);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard stats for the authenticated branch' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics.', type: DashboardStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getDashboardStats(@Request() req: any) {
    return this.branchService.getDashboardStats(req.user.branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new branch under the authenticated business' })
  @ApiResponse({ status: 201, description: 'Branch created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Request() req: any, @Body() createDto: CreateBranchDto) {
    return this.branchService.create({
      ...createDto,
      business_id: req.user.businessId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch by ID' })
  @ApiParam({ name: 'id', description: 'Branch UUID', example: 'a1b2c3d4-...' })
  @ApiResponse({ status: 200, description: 'Branch updated.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(@Param('id') id: string, @Request() req: any, @Body() updateDto: UpdateBranchDto) {
    return this.branchService.update(id, req.user.businessId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch deleted.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.branchService.remove(id, req.user.businessId);
  }
}


