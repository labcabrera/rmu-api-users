import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { ACTIVATION_FEATURES, MAX_CODES_PER_REQUEST, type ActivationFeature } from '../../../domain/aggregates/activation-code-props.js';

export class CreateActivationCodeDto {
  @ApiProperty({ description: 'Expiration date (optional)', example: '2026-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ description: 'Enabled features', example: ['core-law'], enum: ACTIVATION_FEATURES, type: [String] })
  @IsArray()
  @IsIn(ACTIVATION_FEATURES, { each: true })
  features: ActivationFeature[];

  @ApiProperty({ description: 'Number of codes to generate', example: 1, required: false, minimum: 1, maximum: MAX_CODES_PER_REQUEST })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_CODES_PER_REQUEST)
  count?: number;

  @ApiPropertyOptional({
    description: 'Note of the administrator: who the code was given to, or why',
    example: 'Club night, table 2',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
