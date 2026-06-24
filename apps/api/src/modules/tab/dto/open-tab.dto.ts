import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenTabDto {
  @ApiProperty({ example: 'table-uuid-123', description: 'UUID of the table where the tab is opened' })
  @IsNotEmpty()
  @IsString()
  table_id: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the customer (optional)', required: false })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiProperty({ example: 4, description: 'Number of people in the party', default: 1 })
  @IsOptional()
  @IsNumber()
  party_size?: number;

  @ApiProperty({ example: 'Sitting near the window', description: 'Special notes for the tab', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
