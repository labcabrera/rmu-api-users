import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsIn, Matches, IsString } from 'class-validator';
import { ACTIVATION_FEATURES, ActivationFeature } from '../../../domain/aggregates/activation-code-props';

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

  @ApiPropertyOptional({ description: 'Enabled features', example: ['core-law'], enum: ACTIVATION_FEATURES, type: [String] })
  @IsArray()
  @IsIn(ACTIVATION_FEATURES as any, { each: true })
  @IsOptional()
  features?: ActivationFeature[];
}
