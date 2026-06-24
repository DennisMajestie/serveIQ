import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateDto {
  @ApiProperty({ example: 'owner@restaurant.com', description: 'Admin email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret8!', description: 'Admin password' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
