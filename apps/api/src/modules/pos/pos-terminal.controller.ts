import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PosTerminalService } from './pos-terminal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreatePosTerminalDto } from './dto/create-pos-terminal.dto';
import { UpdatePosTerminalDto } from './dto/update-pos-terminal.dto';

@ApiTags('POS Terminals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pos/terminals')
export class PosTerminalController {
  constructor(private readonly posTerminalService: PosTerminalService) {}

  @Get()
  @ApiOperation({ summary: 'Get all POS terminals for the branch' })
  @ApiResponse({ status: 200, description: 'List of POS terminals.' })
  async findAll(@Request() req: any) {
    return this.posTerminalService.findAll(req.user.branchId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active POS terminals for the branch' })
  @ApiResponse({ status: 200, description: 'List of active POS terminals.' })
  async findActive(@Request() req: any) {
    return this.posTerminalService.findActive(req.user.branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a POS terminal by ID' })
  @ApiParam({ name: 'id', description: 'POS terminal UUID' })
  @ApiResponse({ status: 200, description: 'POS terminal details.' })
  @ApiResponse({ status: 404, description: 'POS terminal not found.' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.posTerminalService.findOne(id, req.user.branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new POS terminal' })
  @ApiResponse({ status: 201, description: 'POS terminal created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async create(@Request() req: any, @Body() createDto: CreatePosTerminalDto) {
    return this.posTerminalService.create({
      ...createDto,
      branch_id: req.user.branchId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a POS terminal' })
  @ApiParam({ name: 'id', description: 'POS terminal UUID' })
  @ApiResponse({ status: 200, description: 'POS terminal updated.' })
  @ApiResponse({ status: 404, description: 'POS terminal not found.' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateDto: UpdatePosTerminalDto,
  ) {
    return this.posTerminalService.update(id, req.user.branchId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a POS terminal' })
  @ApiParam({ name: 'id', description: 'POS terminal UUID' })
  @ApiResponse({ status: 200, description: 'POS terminal deleted.' })
  @ApiResponse({ status: 404, description: 'POS terminal not found.' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.posTerminalService.remove(id, req.user.branchId);
  }
}
