import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'menu-item-uuid-123', description: 'UUID of the menu item' })
  @IsNotEmpty()
  @IsString()
  menu_item_id: string;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'No onions', description: 'Special instructions for this item', required: false })
  @IsString()
  notes?: string;
}
