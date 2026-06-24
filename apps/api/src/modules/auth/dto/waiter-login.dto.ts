import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WaiterLoginDto {
  @ApiProperty({ example: '1234', description: '4-digit PIN assigned to the waiter by admin' })
  @IsNotEmpty()
  @IsString()
  pin: string;

  @ApiProperty({ example: 'uuid-of-branch', description: 'Branch ID the waiter belongs to', required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ example: 'uuid-of-business', description: 'Business ID the waiter belongs to', required: false })
  @IsOptional()
  @IsUUID()
  businessId?: string;
}
