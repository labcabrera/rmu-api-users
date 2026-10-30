import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Whether the account can sign in', example: false })
  @IsBoolean()
  enabled: boolean;
}
