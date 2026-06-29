import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferTabDto {
  @ApiProperty({ example: 'target-table-uuid', description: 'UUID of the target table to transfer to' })
  @IsNotEmpty()
  @IsString()
  target_table_id: string;
}
