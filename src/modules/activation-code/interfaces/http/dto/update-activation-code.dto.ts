import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateActivationCodeDto {
  @ApiPropertyOptional({ description: 'Alphanumeric activation code', example: 'ABCD1234' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]+$/)
  code?: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Activation date', example: '2026-06-01T12:00:00.000Z', nullable: true })
  @IsDateString()
  @IsOptional()
  activatedAt?: string | null;

  @ApiPropertyOptional({ description: 'Enabled features', example: ['reports', 'exports'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];
}
