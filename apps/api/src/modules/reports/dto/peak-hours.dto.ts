import { ApiProperty } from '@nestjs/swagger';

export class PeakHoursEntryDto {
  @ApiProperty({ description: 'Hour of the day (0–23)', example: 14 })
  hour: number;

  @ApiProperty({ description: 'Number of orders placed in this hour from paid tabs', example: 42 })
  order_count: number;

  @ApiProperty({ description: 'Total revenue in kobo for this hour', example: 350000 })
  revenue_kobo: number;
}
