import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsString } from 'class-validator';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'Expiration date', example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Enabled features', example: ['reports', 'exports'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}
