import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_PATTERN } from '../../../domain/services/display-name.js';

export class UpdateCurrentUserSettingsDto {
  @ApiPropertyOptional({ type: String, description: 'Measurement system used by the user', enum: ['metric', 'imperial'] })
  @IsOptional()
  @IsIn(['metric', 'imperial'])
  measurementSystem?: 'metric' | 'imperial';
}

export class UpdateCurrentUserDto {
  @ApiPropertyOptional({ description: 'RMU display name (unique, case-insensitive). Keycloak is not changed.', example: 'alice' })
  @IsOptional()
  @IsString()
  @MinLength(DISPLAY_NAME_MIN_LENGTH)
  @MaxLength(DISPLAY_NAME_MAX_LENGTH)
  @Matches(DISPLAY_NAME_PATTERN)
  name?: string;

  @ApiPropertyOptional({ description: 'User settings', type: UpdateCurrentUserSettingsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCurrentUserSettingsDto)
  settings?: UpdateCurrentUserSettingsDto;

  @ApiPropertyOptional({ type: String, description: 'URL to the user profile image', nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Version the client read (from the GET); a different stored version is a 409', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  version?: number;
}
