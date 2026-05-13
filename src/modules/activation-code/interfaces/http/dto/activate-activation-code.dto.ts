import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ActivateActivationCodeDto {
  @ApiProperty({ description: 'Alphanumeric activation code', example: 'ABCD1234' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/)
  code: string;
}
