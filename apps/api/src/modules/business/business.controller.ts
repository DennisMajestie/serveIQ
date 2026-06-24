import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Businesses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated business profile' })
  @ApiResponse({ status: 200, description: 'Business profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@Request() req: any) {
    return this.businessService.findOne(req.user.businessId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateMe(@Request() req: any, @Body() updateDto: any) {
    return this.businessService.update(req.user.businessId, updateDto);
  }
}

