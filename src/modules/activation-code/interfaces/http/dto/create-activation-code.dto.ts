import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ACTIVATION_FEATURES, ActivationFeature } from '../../../domain/aggregates/activation-code-props';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'Expiration date (optional)', example: '2026-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ description: 'Enabled features', example: ['core-law'], enum: ACTIVATION_FEATURES, type: [String] })
  @IsArray()
  @IsIn(ACTIVATION_FEATURES as any, { each: true })
  features: ActivationFeature[];

  @ApiProperty({ description: 'Number of codes to generate', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  count?: number;
}
