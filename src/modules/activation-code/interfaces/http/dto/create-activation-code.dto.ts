import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsString, Matches } from 'class-validator';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'Alphanumeric activation code', example: 'ABCD1234' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/)
  code: string;

  @ApiProperty({ description: 'Expiration date', example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Enabled features', example: ['reports', 'exports'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}
