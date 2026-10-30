import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsIn, Matches, Min, IsString, MaxLength } from 'class-validator';
import { ACTIVATION_FEATURES, type ActivationFeature } from '../../../domain/aggregates/activation-code-props.js';

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

  @ApiPropertyOptional({ type: String, description: 'Activation date', example: '2026-06-01T12:00:00.000Z', nullable: true })
  @IsDateString()
  @IsOptional()
  activatedAt?: string | null;

  @ApiPropertyOptional({ description: 'Enabled features', example: ['core-law'], enum: ACTIVATION_FEATURES, type: [String] })
  @IsArray()
  @IsIn(ACTIVATION_FEATURES, { each: true })
  @IsOptional()
  features?: ActivationFeature[];

  @ApiPropertyOptional({
    description: 'Note of the administrator: who the code was given to, or why',
    example: 'Club night, table 2',
    maxLength: 200,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string | null;

  @ApiPropertyOptional({ description: 'Version the client read (from the GET); a different stored version is a 409', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  version?: number;
}
