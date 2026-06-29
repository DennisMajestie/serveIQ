import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PeakHoursEntryDto } from './dto/peak-hours.dto';
import { BranchService } from '../branch/branch.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly branchService: BranchService,
  ) {}

  @Get('peak-hours')
  @ApiOperation({ summary: 'Get peak hours report — order count and revenue per hour from paid tabs' })
  @ApiQuery({ name: 'branchId', required: true, description: 'Branch UUID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (YYYY-MM-DD), inclusive' })
  @ApiResponse({ status: 200, description: '24 entries (hours 0–23) with order_count and revenue_kobo.', type: [PeakHoursEntryDto] })
  async getPeakHours(
    @Query('branchId') branchId: string,
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Request() req: any,
  ): Promise<PeakHoursEntryDto[]> {
    await this.branchService.findOne(branchId, req.user.businessId);
    return this.reportsService.getPeakHours(branchId, dateFrom, dateTo);
  }
}
