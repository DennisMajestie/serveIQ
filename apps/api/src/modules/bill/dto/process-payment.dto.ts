import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/shared';

export class ProcessPaymentDto {
  @ApiProperty({ example: 150000, description: 'Total amount paid in kobo (1 NGN = 100 kobo)' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: PaymentMethod.CARD,
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'TXN123456789', description: 'Transaction reference (optional)', required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ example: 'pos-terminal-uuid', description: 'POS terminal ID (optional)', required: false })
  @IsString()
  @IsOptional()
  terminal_id?: string;
}
