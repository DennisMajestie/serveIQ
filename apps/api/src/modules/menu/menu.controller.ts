import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './entities/menu-item.entity';

@ApiTags('Menu')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get menu items for the business' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of menu items.', type: [MenuItem] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(
    @Request() req: any,
    @Query('branch_id') branchId?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.menuService.findAll(req.user.businessId, branchId || req.user.branchId, page, perPage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item details.', type: MenuItem })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.menuService.findOne(id, req.user.branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiResponse({ status: 201, description: 'Menu item created.', type: MenuItem })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Request() req: any, @Body() createDto: any) {
    const data = { ...createDto };
    if (data.price && !data.price_kobo) {
      data.price_kobo = Math.round(data.price * 100);
    }
    return this.menuService.create({
      ...data,
      branch_id: req.user.branchId,
      created_by: req.user.userId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item updated.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateDto: any,
  ) {
    const data = { ...updateDto };
    if (data.price && !data.price_kobo) {
      data.price_kobo = Math.round(data.price * 100);
    }
    return this.menuService.update(id, req.user.branchId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item UUID' })
  @ApiResponse({ status: 200, description: 'Menu item deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.menuService.remove(id, req.user.branchId);
  }
}
