
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoidTabDto {
  @ApiProperty({ example: 'Customer changed their mind' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
