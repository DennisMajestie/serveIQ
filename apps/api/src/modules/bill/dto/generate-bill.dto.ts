
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateBillDto {
  @ApiProperty({ example: 10, required: false, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  service_charge_percent?: number;

  @ApiProperty({ example: 0, required: false, minimum: 0, description: 'Discount in kobo' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount_kobo?: number;
}
