import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePosTerminalDto {
  @ApiProperty({ example: 'POS 1', description: 'Label for the POS terminal' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the terminal is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
